import * as express from "express";
import * as manta from "manta";

// Middleware helpers
import { getParameter } from "./helper";
import {
	prependPathToFieldname,
	VIDEO_FILE_FIELDNAME,
	THUMBNAIL_FILE_FIELDNAME,
} from "../objectstore/Constants";

/**
 * General error handler with support for JSON errors
 */
export const errorHandler =
	(): express.ErrorRequestHandler => async (err, req, res, next) => {
		// If headers are sent, then it is generally too late to do anything and
		// we should instead just complete the handler chain and let the
		// response go
		if (res.headersSent) {
			return next(err);
		}

		// If client accepts JSON over HTML, then pass JSON back preferentially
		if (req.accepts(["json", "html"]) === "json") {
			let message: string;
			let status: number;

			// If there is a status encoded in the error, then use that
			if (typeof err.status === "number") {
				status = err.status;
				message = err.message;
			} else {
				status = 500; // Default to `Internal Server Error`
				message = JSON.stringify(err); // Default to stringified version of error
			}

			return res.status(status).json({
				error: message,
			});
		}

		// If it's text that the client accepts, send back text
		if (req.accepts(["text"]) === "text") {
			let message: string;
			let status: number;

			// If there is a status encoded in the error, then use that
			if (typeof err.status === "number") {
				status = err.status;
				message = err.message;
			} else {
				status = 500; // Default to `Internal Server Error`
				message = JSON.stringify(err); // Default to stringified version of error
			}

			return res.status(status).send(message);
		}

		// Otherwise pass error on (generally should end up at default Express
		// error handler)
		return next(err);
	};

/**
 * Error handler for cleaning up uploads to the object store after an error has
 * occurred
 *
 * Note that this does not differentiate between different types of error; it
 * will always delete the content and thumbnail (where defined) if triggered
 */
export const objectStoreUploadContentCleanupErrorHandler =
	(client: manta.manta.MantaClient): express.ErrorRequestHandler =>
		async (err, req, _res, next) => {
			const uploadContentPath = getParameter(
				req,
				prependPathToFieldname(VIDEO_FILE_FIELDNAME)
			);
			const uploadThumbnailPath = getParameter(
				req,
				prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME)
			);

			// Remove uploaded content from object store if defined
			const objectsToRemove: string[] = [];

			if (uploadContentPath !== undefined) {
				objectsToRemove.push(uploadContentPath);
			}

			if (uploadThumbnailPath !== undefined) {
				objectsToRemove.push(uploadThumbnailPath);
			}

			try {
				await Promise.all(
					objectsToRemove.map((path) => {
						return new Promise((resolve, reject) => {
							console.error(`Removing object "${path}"...`);

							client.unlink(path, (err: any, res: any) => {
								if (err) {
									return reject(err);
								}
								return resolve(res);
							});
						});
					})
				);
			} catch (e) {
				console.error(e);

				// NOTE: For now, we don't really care about the content that's
				// hanging around on the object store if the removal couldn't
				// proceed, but we should handle the error somehow for more robust
				// management of files.

			// TODO: Handle error?
			}

			// Pass error on to next error handler
			return next(err);
		};
