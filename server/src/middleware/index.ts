import * as express from "express";
import * as passport from "passport";
import * as mongodb from "mongodb";
import { SSO } from "@uq-elipse/uq-eait-sso";
import * as manta from "manta";
import "../objectstore/Constants";
// Middleware helpers
import { getParameter, setParameter, setObjectId } from "./helper";
import { getConfig } from "../util/Config";
// Models
import {
	prependPathToFieldname,
	THUMBNAIL_FILE_FIELDNAME,
	VIDEO_FILE_FIELDNAME,
	prependInfoToFieldname,
} from "../objectstore/Constants";
import { prependHostUrlToPath, convertToAbsolutePath } from "../objectstore";
import { Type as ResourceType } from "../types/resource";
import { Database } from "../database";
import { UserInfoPayload } from "uq-eait-sso/types/UserInfoPayload";

// =============================================================================

// Note that all middleware are initialised first by running the below functions
// which then return the middleware to be used in the handler chain

/**
 * Get Manta operation configuration
 */
const config = getConfig();
const MANTA_OPERATION_CONFIG = config.MANTA_OPERATION;

/**
 * Middleware to set response as non-cacheable
 */
export const noCacheResponse = (): express.Handler => (_req, res, next) => {
	res.set({
		"Cache-Control": "private, no-cache, no-store, must-revalidate",
		Expires: "-1",
		Pragma: "no-cache",
	});

	return next();
};

/**
 * Middleware to run through the local authentication service provided by
 * Passport
 *
 * This should only need to be used on the relevant log in endpoint.
 */
export const localStrategyAuthenticate = (): express.Handler =>
	// Using `failWithError` means Passport will propagate error into Express'
	// middleware/handler chain
	passport.authenticate("local", { failWithError: true });

/**
 * Middleware to return an error response if a user session does not exist
 */
export const checkUserSessionExists =
	(): express.Handler => (req, res, next) => {
		const user = req.user || res.locals.user;

		if (user === undefined) {
			return next({
				status: 401,
				message:
					"User not authorised or user data not associated with session",
			});
		}

		return next();
	};

/**
 * Middleware to check if `id` exists as a parameter in the request;
 * returns error response if it does not exist
 */
export const checkIdExists = (): express.Handler => (req, _res, next) => {
	const id: string | undefined = req.params.id;

	if (id === undefined) {
		return next({
			status: 400,
			message: "No ID provided",
		});
	}

	return next();
};

/**
 * Middleware that parses the `id` parameter in the request into a Mongo
 * ObjectID
 *
 * To retrieve the ObjectID value, use `getObjectId` from the middleware helper.
 */
export const parseIdAsObjectId = (): express.Handler => (req, _res, next) => {
	const id: string = req.params.id;

	// Check that we can generate a Mongo ObjectID with supplied value
	let objectId: mongodb.ObjectId;

	try {
		objectId = new mongodb.ObjectId(id);
	} catch (e) {
		return next({
			status: 400,
			message: "ID invalid or could not be parsed",
		});
	}

	// Attach ObjectID via. middleware helpers
	setObjectId(req, objectId);

	return next();
};

/**
 * Middleware that captures the return path from a stored video on Manta and
 * executes a thumbnail generation script
 */
export const generateUploadVideoThumbnail =
	(client: manta.manta.MantaClient, folder: string): express.Handler =>
		async (req, _res, next) => {
		// This bit of middleware only works on new resources being uploaded
			const contentPath = getParameter(
				req,
				prependPathToFieldname(VIDEO_FILE_FIELDNAME)
			);
			const existingThumbnailMetadata = getParameter(
				req,
				prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME)
			);

			// Skip if no content path available
			if (contentPath === undefined) {
				return next();
			}

			// Don't process anything if we've already got a new thumbnail file in
			// the pipeline (e.g. uploaded image file)
			if (existingThumbnailMetadata) {
				return next();
			}

			// Check if thumbnail-able
			// We need to query the object store to see if the type is a video
			const objectInfo = getParameter(
				req,
				prependInfoToFieldname(VIDEO_FILE_FIELDNAME)
			);

			if (objectInfo === undefined) {
				return next({
					status: 500,
					message: "Could not extract object info",
				});
			}

			const mimeType: string = objectInfo.type;

			// Ignore files which aren't videos
			if (mimeType.split("/")[0].toLowerCase() !== "video") {
				return next();
			}

			try {
			// Parse request body
				const resourceObject = JSON.parse(req.body["resource"]);

				// Skip if resource's thumbnail is null or undefined
				if (
					resourceObject.thumbnail === null ||
				resourceObject.thumbnail === undefined
				)
					return next();

				// Check that the video snapshot thumbnail option was selected by user
				if (
					!(
						typeof resourceObject.thumbnail.timeToTakeFrame ===
						"number" &&
					resourceObject.thumbnail.timeToTakeFrame >= 0
					)
				) {
				// Catches invalid numbers (negative, NaN)
					return next();
				}

				// Set the time to whatever the client provided
				const timeToTakeFrame = resourceObject.thumbnail.timeToTakeFrame;

				// Delete thumbnail property from resource object since it will later be generated in "insertNew"
				delete resourceObject.thumbnail;

				// Update the request body
				req.body["resource"] = JSON.stringify(resourceObject);

				// For security reasons and to prevent actual resources being
				// "guessed" from the thumbnail file name, we generate a new
				// random ObjectID name for the thumbnail
				const contentName: string = new mongodb.ObjectId().toHexString();

				const uploadThumbnailPath = `${folder}/${contentName}.jpg`;

				// Create thumbnail
				//
				// Weirdly there seems to be a need to remove the temporary
				// `out.jpg` file at the end of each script when doing batch
				// processing. While we're not actually doing multiple thumbnails at
				// once here, it probably would be a good idea to do it anyway.

				const thumbnailScript = `
ffmpeg -nostdin -ss ${timeToTakeFrame} -i "$MANTA_INPUT_FILE" -f mjpeg -vframes 1 -an out.jpg && \
mpipe -p -f out.jpg "${uploadThumbnailPath}" && \
rm out.jpg
`;

				// Create thumbnail job
				const jobId = await new Promise<string>((resolve, reject) => {
					client.createJob(thumbnailScript, (err: any, res: any) => {
						if (err) {
							return reject(err);
						}
						return resolve(res);
					});
				});

				// Feed in the content path as input to the job
				await new Promise<any>((resolve, reject) => {
					client.addJobKey(
						jobId,
						contentPath, // Resource we want to use for $MANTA_INPUT_FILE/OBJECT
						{ end: true }, // Closes the job input now (we only have one object -> thumbnail to process)
						(err: any, res: any) => {
							if (err) {
								return reject(err);
							}
							return resolve(res);
						}
					);
				});

				// Number of tries to check for job completion
				let checkTries: number = MANTA_OPERATION_CONFIG.JOB_CHECK_TRIES;

				while (checkTries-- > 0) {
				// Call Manta to check job info
					const jobInfo = await new Promise<any>((resolve, reject) => {
						client.job(jobId, (err: any, res: any) => {
							if (err) {
								return reject(err);
							}
							return resolve(res);
						});
					});

					// If job info says the thumbnail task is done, we can continue
					if (jobInfo.state === "done") {
					// Pass info on
						setParameter(
							req,
							prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME),
							uploadThumbnailPath
						);

						return next();
					}

					// Wait 250ms before retry
					await new Promise<void>((r) => setTimeout(() => r(), 250));
				}

				// If we reach here, then the task did not complete within the
				// desired number of check tries
				throw new Error("Thumbnail job did not complete within timeout");
			} catch (e) {
				return next(e);
			}
		};

/**
 * Pulls out the given property's content from request body, and replaces the
 * request body reference with that object just pulled out
 */
export const mapPropertyToRequestBody =
	(prop: string): express.Handler =>
		async (req, _res, next) => {
			req.body = req.body[prop];
			next();
		};

/**
 * Middleware which detects if a thumbnail has to be generated for an existing video resource on Manta.
 * Generates and saves thumbnail.
 */
export const updateVideoFrameThumbnail =
	(client: manta.manta.MantaClient, folder: string): express.Handler =>
		async (req, _res, next) => {
			try {
			// Get resource from req.body
				const resource = req.body;

				// Skip if resource's thumbnail is null or undefined
				if (resource.thumbnail === null || resource.thumbnail === undefined)
					return next();

				/**
                  * The following must all be true to proceed
                  * `resource` is a video
                  * `contentRelativePath` exists (not null/undefined, and non-empty string)
                  * `timeToTakeFrame` is defined as a number
                  * `timeToTakeFrame` is not NaN and non-negative
                **/
				if (
					!(
						resource.type === ResourceType.VIDEO_INTERNAL &&
					resource.content.contentRelativePath &&
					typeof resource.thumbnail.timeToTakeFrame === "number" &&
					resource.thumbnail.timeToTakeFrame >= 0
					)
				) {
					return next();
				}

				// Get relative path to the video resource (so that Manta has a reference to the video on which the thumbnail job has to be executed)
				const contentPath = resource.content.contentRelativePath;

				// For security reasons and to prevent actual resources being
				// "guessed" from the thumbnail file name, we generate a new
				// random ObjectID name for the thumbnail
				const contentName: string = new mongodb.ObjectId().toHexString();

				const uploadThumbnailPath = `${folder}/${contentName}.jpg`;

				// Create thumbnail
				//
				// Weirdly there seems to be a need to remove the temporary
				// `out.jpg` file at the end of each script when doing batch
				// processing. While we're not actually doing multiple thumbnails at
				// once here, it probably would be a good idea to do it anyway.

				const timeToTakeFrame: number = resource.thumbnail.timeToTakeFrame; // seconds

				const thumbnailScript = `
ffmpeg -nostdin -ss ${timeToTakeFrame} -i "$MANTA_INPUT_FILE" -f mjpeg -vframes 1 -an out.jpg && \
mpipe -p -f out.jpg "${uploadThumbnailPath}" && \
rm out.jpg
`;

				// Create thumbnail job
				const jobId = await new Promise<string>((resolve, reject) => {
					client.createJob(thumbnailScript, (err: any, res: any) => {
						if (err) {
							return reject(err);
						}
						return resolve(res);
					});
				});

				// Feed in the content path as input to the job
				await new Promise<any>((resolve, reject) => {
					client.addJobKey(
						jobId,
						contentPath, // Resource we want to use for $MANTA_INPUT_FILE/OBJECT
						{ end: true }, // Closes the job input now (we only have one object -> thumbnail to process)
						(err: any, res: any) => {
							if (err) {
								return reject(err);
							}
							return resolve(res);
						}
					);
				});

				// Number of tries to check for job completion
				let checkTries: number = MANTA_OPERATION_CONFIG.JOB_CHECK_TRIES;

				while (checkTries-- > 0) {
				// Call Manta to check job info
					const jobInfo = await new Promise<any>((resolve, reject) => {
						client.job(jobId, (err: any, res: any) => {
							if (err) {
								return reject(err);
							}
							return resolve(res);
						});
					});

					// If job info says the thumbnail task is done, we can continue
					if (jobInfo.state === "done") {
					// Pass info on
						resource.thumbnail = {
							url: prependHostUrlToPath(
								convertToAbsolutePath(uploadThumbnailPath)
							),
							size: "cover",
						};

						// Assign resource with updated thumbnail back to req.body
						req.body = resource;

						return next();
					}

					// Wait 250ms before retry
					await new Promise<void>((r) => setTimeout(() => r(), 250));
				}

				// If we reach here, then the task did not complete within the
				// desired number of check tries
				throw new Error("Thumbnail job did not complete within timeout");
			} catch (e) {
				return next(e);
			}
		};
export const getTokenFromRequest = (
	req: express.Request
): undefined | string => {
	return (req.cookies || {})["EAIT_WEB"];
};

/**
 * Retrieve SSO user from the header and use the SSO package to
 * extract the information
 * @param req 
 * @param res 
 * @returns ssoPayload that contains SSO information.
 */
export const getSSOUser = async (
	req: express.Request,
	res: express.Response,
) => {
	try{
		const AUTH_HOST = getConfig().AUTH.UQSSO_SERVER_DOMAIN;
		const sso = new SSO(<string>AUTH_HOST);
		const ssoPayload = await sso.getUserInfoPayload(getTokenFromRequest(req) as string);
		return ssoPayload;
	} catch(e){
		console.error(e);
		return res.status(500);
	}
};


export const retrieveSSOUser = async (req: express.Request,
	res: express.Response) => {
	const payload = await getSSOUser(req, res) as UserInfoPayload;
	const findUser = await Database.Models.User.getByUsername(payload.user);
	return findUser;
}

/**
 * This is the middleware that will be used to authenticate users
 * using UQ SSO.
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const authenticateSSOUser = async (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	try {
		if (req.user) return next();

		const token = getTokenFromRequest(req);
		// We are assuming this is a guest user since no user token is provided and the next
		// middleware will handle the guest user.
		if (!token) return next();
		const payload = await retrieveSSOUser(req, res);
		if (payload.length === 0) return res.status(401).json({
			message: "Forbidden - You are not authorised to access admin privileges."
		});
		res.locals.user = payload[0];
		return next();
	}
	catch(e){
		console.error(e);
		return res.status(500);
	}
};