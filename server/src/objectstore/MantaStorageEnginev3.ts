import * as stream from "stream";
import * as express from "express";
import * as multer from "multer";
import * as manta from "manta";
import * as mongodb from "mongodb";
import { setParameter } from "../middleware/helper";
import {
	VIDEO_FILE_FIELDNAME,
	prependPathToFieldname,
	prependInfoToFieldname,
	THUMBNAIL_FILE_FIELDNAME,
	EDITOR_IMAGE_FILE_FIELDNAME,
} from "./Constants";

export class MantaStorageEnginev3 implements multer.StorageEngine {
	private readonly manta: manta.manta.MantaClient;
	private getDestination: (fieldname: string) => string | undefined;
	constructor(
		manta: manta.manta.MantaClient,
		getDestination: (fieldname: string) => string | undefined
	) {
		this.manta = manta;
		this.getDestination = getDestination;
	}

	public async _handleFile(
		req: express.Request,
		file: Express.Multer.File,
		cb: (error: any, info?: Partial<Express.Multer.File>) => void
	) {
		// For some reason the typings for the `file` parameter don't have the
		// "stream" property
		const fileStream: stream.Readable = (file as any).stream;

		// Using Mongo ObjectIDs to uniquely identify resources
		const uniqueId = new mongodb.ObjectId();

		// Extracting the file extension for reattaching on end of object ID
		const fileExtension = (
			(file.originalname || "").split(".").pop() || ""
		).trim();

		if (fileExtension.length === 0) {
			return cb(new Error("Could not detect file extension"));
		}

		// Generate the full upload path to Manta
		const folder = this.getDestination(file.fieldname);
		const uploadContentPath = `${folder}/${uniqueId.toHexString()}.${fileExtension}`;
		if (folder) {
			try {
				// Make directory in case it does not yet exist
				await new Promise((resolve, reject) => {
					this.manta.mkdirp(folder, (err: any, res: any) => {
						if (err) {
							return reject(err);
						}
						return resolve(res);
					});
				});

				// Put file
				await new Promise<any>((resolve, reject) => {
					this.manta.put(
						uploadContentPath,
						fileStream,
						{
							// mkdirs: true,    // This flag does not work because the EAIT Manta service is returning a "ResourceNotFound" error rather than the expected "DirectoryDoesNotExistError" error.
							headers: {
								"access-control-allow-origin": "*",
								"access-control-allow-methods": "GET",
							},
						},
						(err: any, res: any) => {
							if (err) {
								return reject(err);
							}
							return resolve(res);
						}
					);
				});

				// Get info back
				const uploadObjectInfo = await new Promise<any>(
					(resolve, reject) => {
						this.manta.info(
							uploadContentPath,
							(err: any, res: any) => {
								if (err) {
									return reject(err);
								}
								return resolve(res);
							}
						);
					}
				);

				// NOTE: file.fieldname could be directly passed in the setParameter call without having to go through the if statements
				// However, this approach is adopted so that only recognized files with certain fieldnames can be uploaded
				// (This was done since setParameter keyof check is (effectively) disabled)

				if (file.fieldname === EDITOR_IMAGE_FILE_FIELDNAME) {
					setParameter(
						req,
						prependPathToFieldname(EDITOR_IMAGE_FILE_FIELDNAME),
						uploadContentPath
					);
					setParameter(
						req,
						prependInfoToFieldname(EDITOR_IMAGE_FILE_FIELDNAME),
						uploadObjectInfo
					);
				}
				if (file.fieldname === THUMBNAIL_FILE_FIELDNAME) {
					setParameter(
						req,
						prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME),
						uploadContentPath
					);
					setParameter(
						req,
						prependInfoToFieldname(THUMBNAIL_FILE_FIELDNAME),
						uploadObjectInfo
					);
				}

				if (file.fieldname === VIDEO_FILE_FIELDNAME) {
					setParameter(
						req,
						prependPathToFieldname(VIDEO_FILE_FIELDNAME),
						uploadContentPath
					);
					setParameter(
						req,
						prependInfoToFieldname(VIDEO_FILE_FIELDNAME),
						uploadObjectInfo
					);
				}

				return cb(null);
			} catch (e) {
				return cb(e);
			}
		}
	}

	public async _removeFile(
		_req: express.Request,
		_file: Express.Multer.File,
		cb: (error: any) => void
	) {
		// TODO: Implement this
		cb(null);
	}
}
