import * as express from "express";
import * as mongodb from "mongodb";
import { Database } from "../../../database";
import { getParameter } from "../../../middleware/helper";
import {
	convertToAbsolutePath,
	prependHostUrlToPath,
} from "../../../objectstore";
import { Resource, Hydrate, IResource } from "../../../models/Resource";
import {
	IResource as TypeResource,
	Type as ResourceType,
	IResource_Collection,
	IResource_Collection_Topic_Bundle,
} from "../../../types/resource";
import {
	prependPathToFieldname,
	VIDEO_FILE_FIELDNAME,
	THUMBNAIL_FILE_FIELDNAME,
	EDITOR_IMAGE_FILE_FIELDNAME,
} from "../../../objectstore/Constants";
import { convertTree } from "../../../util/GenerateCsv";
import { getAllResources } from "../../../util/GetAllResource";

// =============================================================================

export const getRoots: express.RequestHandler = async (_req, res, next) => {
	try {
		const roots = await Database.Models.Resource.getCollectionRoots();
		return res.status(200).json(roots);
	} catch (e) {
		return next(e);
	}
};

// Endpoint to TreeNode
export const getTreeNode: express.RequestHandler = async (_req, res) => {
	try {
		const treeNode = await getAllResources();
		return res.status(200).json(treeNode);
	} catch (e) {
		return res.status(500).json({message: "Data error"});
	}
};

// Endpoint to download CSV file
export const getDownloadTree: express.RequestHandler = async (_req, res) => {
	try {
		const csv = await convertTree();
		return res.set({
			"Content-Type": "text/csv",
			"Content-Disposition": `attachment; filename="crucibleResourceData.csv"`,
		}).send(csv);
	} catch (e) {
		return res.status(500).json({message: "Data error"});
	}
};

/**
 * Insert new resource into database
 * @returns Axios response containing new resource just inserted
 */
export const insertNew: express.RequestHandler = async (req, res, next) => {
	const resourceContent: string | undefined = req.body;

	if (resourceContent === undefined) {
		console.log("req.body undefined");
		return next({
			status: 400,
			message: "Resource content not defined",
		});
	}

	// We need to parse the resource content because we expect that the
	// input was via. a multipart form, so the JSON component is under
	// `resource`

	let resource: any;
	try {
		resource = JSON.parse(resourceContent);
	} catch {
		return next({
			status: 400,
			message: "Resource content invalid or could not be parsed",
		});
	}

	// Check that we have a resource object
	if (!IResource.is(resource)) {
		return next({
			status: 400,
			message:
				"Resource content invalid or does not match expected object interface",
		});
	}

	// Hydrate to convert non-primitive values
	Hydrate(resource);

	// Get content and thumbnail paths
	const uploadContentPath = getParameter(
		req,
		prependPathToFieldname(VIDEO_FILE_FIELDNAME)
	);
	const uploadThumbnailPath = getParameter(
		req,
		prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME)
	);

	if (uploadContentPath !== undefined) {
		// If there was content that was uploaded, check that the type of
		// the resource actually corresponds to one that uses it
		if (!Resource.IsCanContainObjectStoreContent(resource)) {
			return next({
				status: 400,
				message:
					"Cannot associate uploaded content with resource object being created",
			});
		}

		switch (resource.type) {
			case ResourceType.VIDEO_INTERNAL: {
				resource.content = {
					contentRelativePath: uploadContentPath,
					url: prependHostUrlToPath(
						convertToAbsolutePath(uploadContentPath)
					),
				};

				break;
			}

			default:
				return next({
					status: 400,
					message:
						"Upload content handler for given resource type does not exist",
				});
		}
	}

	if (resource.thumbnail === null) {
		// Do nothing: thumbnail explicitly `null`
	} else if (
		resource.thumbnail &&
		resource.thumbnail.url &&
		resource.thumbnail.size
	) {
		// Do nothing since thumbnail is already well defined
	} else if (uploadThumbnailPath) {
		// If a thumbnail was uploaded/generated, we need to convert the path to the public URL
		resource.thumbnail = {
			url: prependHostUrlToPath(
				convertToAbsolutePath(uploadThumbnailPath)
			),
			size: "cover",
		};
	} else {
		// Set the resource thumbnail to null by default if none of the above conditions are true
		resource.thumbnail = null;
	}

	// Recursively add the following resource's children as new children.
	if (
		(resource.type === ResourceType.RESOURCE_COLLECTION ||
			resource.type === ResourceType.RESOURCE_COLLECTION_ROOT ||
			resource.type === ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE) &&
		(resource as IResource_Collection | IResource_Collection_Topic_Bundle)
			.content.children.length
	) {
		(
			resource as IResource_Collection | IResource_Collection_Topic_Bundle
		).content.children = await insertChildren(
			(
				resource as
					| IResource_Collection
					| IResource_Collection_Topic_Bundle
			).content.children
		);
	}

	try {
		// Insert then return the saved resource
		const result = await Database.Models.Resource.insert(resource);

		// Get the resource just inserted
		const savedResource = await Database.Models.Resource.getBySingleId(
			result.insertedId
		);

		return res.status(200).json(savedResource);
	} catch (e) {
		return next(e);
	}
};

/**
 * Make copies of children and insert them into database
 * @param children Children resource
 * @returns array of ids for the children
 */
const insertChildren = async (children: any) => {
	const newChildren = [];
	for (const child of children) {
		const findChildById = await Database.Models.Resource.getBySingleId(
			child
		);
		if (!findChildById) throw new Error("");

		const childObj = { ...findChildById } as TypeResource;

		// Recursively add children as new children.
		if (
			(childObj.type === ResourceType.RESOURCE_COLLECTION ||
				childObj.type === ResourceType.RESOURCE_COLLECTION_ROOT ||
				childObj.type ===
					ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE ||
				childObj.type === ResourceType.QUIZ_UQ_CHEM) &&
			(
				childObj as
					| IResource_Collection
					| IResource_Collection_Topic_Bundle
			).content.children.length
		) {
			// Make copies of all the collections children as well
			(
				childObj as
					| IResource_Collection
					| IResource_Collection_Topic_Bundle
			).content.children = await insertChildren(
				(
					childObj as
						| IResource_Collection
						| IResource_Collection_Topic_Bundle
				).content.children
			);
		}

		//Create new copy
		const newChild = await Database.Models.Resource.insert({
			...childObj,
			_id: new mongodb.ObjectId(),
		});

		newChildren.push(newChild.insertedId);
	}
	return newChildren;
};

/** Prepare response object for compatibility with TinyMCE editor */
export const processEditorImageFile: express.RequestHandler = async (
	req,
	res,
	_next
) => {
	const locationObject = { location: "" };
	const absolutePath = prependHostUrlToPath(
		convertToAbsolutePath(
			getParameter(
				req,
				prependPathToFieldname(EDITOR_IMAGE_FILE_FIELDNAME)
			) || ""
		)
	);
	locationObject.location = absolutePath;
	return res.status(200).json(locationObject);
};

export const updateExistingThumbnailUpload: express.RequestHandler = async (
	req,
	_res,
	next
) => {
	const resourceContent: string | undefined = req.body;

	if (resourceContent === undefined) {
		return next({
			status: 400,
			message: "Resource content not defined",
		});
	}

	// We need to parse the resource content because we expect that the
	// input was via. a multipart form, so the JSON component is under
	// `resource`

	let resource: any;

	try {
		resource = JSON.parse(resourceContent);
	} catch {
		return next({
			status: 400,
			message: "Resource content invalid or could not be parsed",
		});
	}

	// No need to do Taipu object interface checks here, as the `updateById`
	// handler does that

	// Get content and thumbnail paths
	const uploadThumbnailPath = getParameter(
		req,
		prependPathToFieldname(THUMBNAIL_FILE_FIELDNAME)
	);

	if (resource.thumbnail === null) {
		// Do nothing: thumbnail explicitly `null`
	} else if (uploadThumbnailPath) {
		// If a thumbnail was uploaded/generated, we need to convert the path to the public URL
		resource.thumbnail = {
			url: prependHostUrlToPath(
				convertToAbsolutePath(uploadThumbnailPath)
			),
			size: "cover",
		};
	}

	req.body = resource;

	return next();
};
