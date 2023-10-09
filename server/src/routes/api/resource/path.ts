import * as express from "express";
import * as mongodb from "mongodb";

import { Database } from "../../../database";
import {
	createPermissionAuthResultCacheMap,
	isResourceLocked,
} from "../../../resource/permission";
import { Resource } from "../../../models/Resource";
import {
	IResource,
	IResource_Base,
	IResource_Collection,
	IResource_Collection_Topic_Bundle,
	IResource_Smart_Quiz,
} from "../../../types/resource";
import { retrieveSSOUser } from "../../../middleware";

// =============================================================================

export const isAdminSSO = async (
	req: express.Request,
	res: express.Response,
) => {
	try {
		const ssoUser = await retrieveSSOUser(req, res);
		return ssoUser[0];
	} catch (e) {
		console.error(e);
		return false;
	}
};

export const getAllByPath: express.RequestHandler = async (req, res, next) => {
	// Determine if admin user signed in (any user is assumed to be admin)
	const isAdmin = (req.user || (await isAdminSSO(req,res))) !== undefined;

	// Take the first unlabelled param
	const path: string | undefined = req.params[0];

	if (path === undefined) {
		return next({
			status: 400,
			message: "No path provided",
		});
	}

	// Split the path given, filter out blanks
	const ids = path
		.split("/")
		.map((x) => x.trim())
		.filter((x) => x.length !== 0);

	// Map out object IDs
	let objectIds: mongodb.ObjectId[];

	try {
		objectIds = ids.map((id) => new mongodb.ObjectID(id));
	} catch {
		return next({
			status: 400,
			message: "ID invalid or could not be parsed",
		});
	}

	// If array is empty, return nothing
	if (objectIds.length === 0) {
		return res.status(200).json([]);
	}

	// Fetch all the requested resources on path
	const resources = await Database.Models.Resource.getById(...objectIds);

	// Ensure that the resources array matches what we expect
	//
	// Array length only matches if every element is unique (e.g. no
	// circular references) and all elements were found
	if (resources.length !== objectIds.length) {
		return next({
			status: 404,
			message:
				"Resources in path not found or invalid reference encountered",
		});
	}

	// Ensure resources array is ordered by our path by remapping against
	// the input array
	const resourceArray = objectIds.map(
		(id) => resources.find((resource) => id.equals(resource._id!))!
	);

	// For the path itself, we only consider those which are collections
	const collections = resourceArray.filter((resource) =>
		Resource.IsCollection(resource)
	) as (IResource_Base &
		(
			| IResource_Collection
			| IResource_Collection_Topic_Bundle
			| IResource_Smart_Quiz
		))[];

	// We are about to go through multiple auth checks when going along the
	// path, so we cache the auth results with a Map so we don't
	// unnecessarily hit auth providers many times in succession
	const authResultCacheMap = createPermissionAuthResultCacheMap();

	// Check that all collections on the path are available for the user to
	// retrieve
	//
	// Note that we *do not* check for non-collection resources in this
	// loop; this is because such resources are the final object in a path
	// and it instead will be delivered via. the `children` array.
	//
	// As the `children` array will also have permission checks below, this
	// means that if the resource is indeed locked, the client will be aware
	// of the resource's need for authorisation, rather than just be left
	// with an empty HTTP401 which can't be handled meaningfully.

	// We only check the collections on the path if the user is NOT an
	// administrator
	if (!isAdmin) {
		for (const collection of collections) {
			const collectionLocked = await isResourceLocked(
				collection,
				req,
				authResultCacheMap
			);

			// If content locked, the path is now invalid and anything later in
			// the path can't be retrieved anyway
			if (collectionLocked) {
				return next({
					status: 401,
					message:
						"One or more resources in path require authorisation",
				});
			}
		}
	}

	// We always expect the first element of the path to be the collection
	// root
	if (!Resource.IsCollectionRoot(collections[0]!)) {
		return next({
			status: 400,
			message: "Path root is not a valid collection root resource",
		});
	}

	// Paths are only valid if the parent-child chain exists
	//
	// Note that this only runs if `collections.length` > 1, which is what
	// we expect
	for (let i = 0; i < collections.length - 1; ++i) {
		const parent = collections[i]; // Current position
		const child = collections[i + 1]; // Next on path

		if (parent === undefined) {
			throw new Error("Parent resource node is undefined");
		}

		if (child === undefined) {
			throw new Error("Child resource node is undefined");
		}

		// Parents must always be collections
		if (!Resource.IsCollection(parent)) {
			return next({
				status: 400,
				message: "Intermediate resource on path is not a collection",
			});
		}

		// NOTE: We currently don't check whether intermediate collections
		// are roots or not - we implicitly infer that they are not because
		// root should not be permitted to become a child of some other
		// collection

		const childId = child._id;

		// If the next resource down the chain is not a defined child of the
		// parent then the path does not exist
		if (!parent.content.children.some((x) => x.equals(childId!))) {
			return next({
				status: 404,
				message: "Requested resource path does not exist",
			});
		}
	}

	// We get all the children from the active collection
	let children: IResource[] = [];

	const activeCollection = collections[collections.length - 1];

	if (activeCollection !== undefined) {
		const activeCollectionChildrenIds = activeCollection.content.children;

		// There should be a `children` array for collections always
		if (
			activeCollectionChildrenIds === undefined ||
			!Array.isArray(activeCollectionChildrenIds)
		) {
			return next({
				status: 500,
				message: "No children array in active collection",
			});
		}

		// Get the children resources (this may be out of order)
		const childrenResources = await Database.Models.Resource.getById(
			...activeCollectionChildrenIds
		);

		// Reorder to match active collection children array and filter out
		// missing resources from children set
		children = activeCollectionChildrenIds
			.map((childId) =>
				childrenResources.find((child) => childId.equals(child._id!))
			)
			.filter((x) => x !== undefined) as IResource[];

		// Check if we have the same items back
		if (children.length !== activeCollectionChildrenIds.length) {
			return next({
				status: 500,
				message: "Missing children in active collection encountered",
			});
		}
	}

	// If the last item in path a child in the active collection, then
	// set that as the object ID
	let activeChild: mongodb.ObjectId | null = null;
	const lastPathItem = resourceArray[resourceArray.length - 1];

	// If we have a non-collection item as the last item
	if (lastPathItem && !Resource.IsCollection(lastPathItem)) {
		const lastPathItemId = lastPathItem._id!;
		// ... and it happens to be one of the active collection's children
		if (children.some((child) => lastPathItemId.equals(child._id!))) {
			// ... then the active child is set to the object ID of the last path item
			activeChild = lastPathItemId;
		}
	}

	// We also need to check children for resource permissions
	for (const child of children) {
		// Check whether resource is locked or not
		let resourceLocked: boolean;

		// The resource is always unlocked for admins, except for LTI tools,
		// otherwise we test whether the resource is indeed locked for this
		// request
		if (isAdmin && !Resource.IsServiceExternalLTI(child)) {
			resourceLocked = false;
		} else {
			resourceLocked = await isResourceLocked(
				child,
				req,
				authResultCacheMap
			);
		}

		// Add `_currentlyLocked` flag to returned resources
		(child.permissions as any)._currentlyLocked = resourceLocked;

		// If NOT an admin and content locked, empty `content`
		//
		// This is because admins should always have access to the content,
		// regardless of the lock state
		if (!isAdmin && resourceLocked && child.content) {
			(child.content as any) = {};
		}
	}

	return res.status(200).json({
		collections,
		children,
		activeChild,
	});
};
