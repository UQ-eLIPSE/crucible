import * as express from "express";
import * as mongodb from "mongodb";

// Middleware helpers

/** Namespace for middleware extension */
const APP = "_app";

/**
 * Interface for our extension to the `req.params` object
 */
export interface ExtensionObject {
	// Objects being requested
	objectId?: mongodb.ObjectId;

	// Working object (e.g. "Resource" if in a working in a resource route)
	workingObject?: any;

	[key: string]: any;
}

/**
 * Express request object type with helper extension object
 */
export type ExtendedRequest = express.Request & {
	params: {
		_app: ExtensionObject;
	};
};

/**
 * Extends the Express response object with a partial object for use with helper
 * extensions, if the object does not already exist
 *
 * @param req Express request object
 */
function extendObj(req: express.Request) {
	if (req.params[APP] === undefined) {
		(req as ExtendedRequest).params[APP] = {};
	}

	return req as ExtendedRequest;
}

function getExtension(req: express.Request) {
	// Extend by default, if not present
	return extendObj(req).params[APP];
}

export function getParameter<
	K extends keyof ExtensionObject,
	T = ExtensionObject[K]
>(req: express.Request, parameter: K): T {
	return getExtension(req)[parameter];
}

export function setParameter<
	K extends keyof ExtensionObject,
	T extends ExtensionObject[K]
>(req: express.Request, parameter: K, value: T): T {
	return (getExtension(req)[parameter] = value);
}

export function getObjectId(req: express.Request) {
	return getParameter(req, "objectId");
}

export function setObjectId(req: express.Request, id: mongodb.ObjectId) {
	return setParameter(req, "objectId", id);
}
