import * as fs from "fs";

import * as manta from "manta";
import { MantaStorageEnginev3 } from "./MantaStorageEnginev3";
import { getConfig } from "../util/Config";
// =============================================================================

// Upon initialisation, we get the raw copy of the Manta configuration object
// and create an internal reference that either points to that or some
// placeholder proxy when manta is disabled

const config = getConfig();

const rawMantaConfig = config.MANTA;

let mantaConfig: typeof rawMantaConfig;

if (!rawMantaConfig.ENABLED) {
	console.warn("***** Manta is disabled *****");

	// Placeholder is recursive, with support for #toString() and #valueOf()
	// that return dummy values
	const placeholderObject: typeof rawMantaConfig = new Proxy(
		{},
		{
			get: (_target, property) => {
				// Built-ins for converting primitive values
				//
				// More information can be gathered by looking at the set of
				// "well-known symbols" defined in the ES6 specification.
				switch (property) {
					case Symbol.toStringTag:
						return () => "";
					case Symbol.toPrimitive:
						return (hint: string) => {
							switch (hint) {
								case "number":
									return 0;
								case "string":
									return "";
							}
							return false;
						};
				}

				// When doing other nested accesses, we return the same proxy to
				// enable recursive object property lookups
				console.warn(
					`Access to placeholder Manta configuration object at "${property.toString()}"`
				);
				return placeholderObject;
			},
		}
	) as any;

	mantaConfig = placeholderObject;
} else {
	mantaConfig = rawMantaConfig;
}

// =============================================================================

let mantaClient: manta.manta.MantaClient | undefined = undefined;

function initMantaClient() {
	// If Manta is disabled, then return a placeholder proxy that throws an
	// error when anything is accessed/used
	if (!rawMantaConfig.ENABLED) {
		return new Proxy(
			{},
			{
				get: (_target, property) => {
					const error = new Error(
						`Attempted to access "${property.toString()}" on disabled Manta client`
					);

					// Print to console in case Proxy obscures error
					console.error(error.stack);

					throw error;
				},
			}
		) as manta.manta.MantaClient;
	}

	// If Manta not disabled, then set up client as usual
	return manta.createClient({
		sign: manta.privateKeySigner({
			key: fs.readFileSync(mantaConfig.KEY_PATH, "utf-8"),
			keyId: mantaConfig.KEY_ID,
			user: mantaConfig.USER,
			subuser: mantaConfig.SUBUSER,
			role: mantaConfig.ROLES,
		}),
		user: mantaConfig.USER,
		subuser: mantaConfig.SUBUSER,
		url: mantaConfig.HOST_URL,
		role: mantaConfig.ROLES,
	});
}

export function getObjectStoreClient() {
	// Return a client singleton
	if (mantaClient !== undefined) {
		return mantaClient;
	}

	return (mantaClient = initMantaClient());
}

export function generateStorageEnginev3(
	client: manta.manta.MantaClient,
	getDestination: (fieldname: string) => string | undefined
) {
	return new MantaStorageEnginev3(client, getDestination);
}

export function convertToAbsolutePath(path: string) {
	return path.replace(/^~~\//, `/${mantaConfig.USER}/`);
}

export function prependHostUrlToPath(path: string) {
	return `${mantaConfig.HOST_URL}${path}`;
}

export function generateUploadContentFolderPath() {
	return `${mantaConfig.HOST_FOLDER}/${mantaConfig.UPLOAD_SUBFOLDER.CONTENT}`;
}

export function generateUploadThumbnailFolderPath() {
	return `${mantaConfig.HOST_FOLDER}/${mantaConfig.UPLOAD_SUBFOLDER.THUMBNAIL}`;
}

export function generateUploadEditorImagesFolderPath() {
	return `${mantaConfig.HOST_FOLDER}/${mantaConfig.UPLOAD_SUBFOLDER.EDITOR_IMAGES}`;
}
