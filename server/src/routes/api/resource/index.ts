import * as express from "express";
import * as multer from "multer";

// Middleware
import {
	checkUserSessionExists,
	parseIdAsObjectId,
	generateUploadVideoThumbnail,
	mapPropertyToRequestBody,
	updateVideoFrameThumbnail,
	authenticateSSOUser,
} from "../../../middleware";
import { objectStoreUploadContentCleanupErrorHandler } from "../../../middleware/error";
import "../../../objectstore/Constants";

// Handlers
import {
	getRoots,
	insertNew,
	updateExistingThumbnailUpload,
	processEditorImageFile,
	getDownloadTree,
	getTreeNode,
} from "./root";
import { getById, updateById, deleteById, getQuestionsById } from "./id";
import { getAllByPath } from "./path";

// Manta
import {
	getObjectStoreClient,
	generateUploadContentFolderPath,
	generateUploadThumbnailFolderPath,
	generateStorageEnginev3,
	generateUploadEditorImagesFolderPath,
} from "../../../objectstore";
import {
	THUMBNAIL_FILE_FIELDNAME,
	VIDEO_FILE_FIELDNAME,
	EDITOR_IMAGE_FILE_FIELDNAME,
} from "../../../objectstore/Constants";

// =============================================================================

// Setting up Manta client and middleware
const uploadThumbnailFolder = generateUploadThumbnailFolderPath();

const objectStoreClient = getObjectStoreClient();

/** Generates directory for storage engine based on the fieldname of the file being processed */
const fieldName = (fieldname: string) => {
	if (fieldname === THUMBNAIL_FILE_FIELDNAME) {
		return generateUploadThumbnailFolderPath();
	}

	if (fieldname === VIDEO_FILE_FIELDNAME) {
		return generateUploadContentFolderPath();
	}

	if (fieldname === EDITOR_IMAGE_FILE_FIELDNAME) {
		return generateUploadEditorImagesFolderPath();
	}
	return undefined;
};
// Setting up routes
const router = express.Router();

router

	// Handle image uploads from rich text editor (TinyMCE)
	.post(
		"/editorImages/*",
		authenticateSSOUser,
		checkUserSessionExists(),
		multer({
			storage: generateStorageEnginev3(objectStoreClient, fieldName),
		}).single(EDITOR_IMAGE_FILE_FIELDNAME),
		processEditorImageFile,
		objectStoreUploadContentCleanupErrorHandler(objectStoreClient)
	)

	// Everything else
	.get("/", getRoots)

	// JSON formatted Tree Node
	.get("/getTreeNode", getTreeNode)

	// Downloads CSV file containing tree data structure
	.get("/dataDownload", getDownloadTree)

	.post(
		"/",
		authenticateSSOUser,
		checkUserSessionExists(),

		multer({
			storage: generateStorageEnginev3(objectStoreClient, fieldName),
		}).fields([
			{ name: VIDEO_FILE_FIELDNAME, maxCount: 1 },
			{ name: THUMBNAIL_FILE_FIELDNAME, maxCount: 1 },
		]),
		generateUploadVideoThumbnail(objectStoreClient, uploadThumbnailFolder),
		mapPropertyToRequestBody("resource"),
		insertNew,
		objectStoreUploadContentCleanupErrorHandler(objectStoreClient)
	)

	// Individual resource
	.get("/:id", parseIdAsObjectId(), getById)

	// Editing resource (without thumbnail file upload)
	.patch(
		"/:id",
		authenticateSSOUser,
		checkUserSessionExists(),
		updateVideoFrameThumbnail(objectStoreClient, uploadThumbnailFolder),
		parseIdAsObjectId(),
		updateById
	)

	// If thumbnail file is uploaded while editing resource
	.put(
		"/:id",
		authenticateSSOUser,
		checkUserSessionExists(),
		parseIdAsObjectId(),
		multer({
			storage: generateStorageEnginev3(objectStoreClient, fieldName),
		}).fields([{ name: THUMBNAIL_FILE_FIELDNAME, maxCount: 1 }]),
		mapPropertyToRequestBody("resource"),
		// Middleware to embed newly created thumbnail path into resource (req) body
		updateExistingThumbnailUpload,
		updateById,
		objectStoreUploadContentCleanupErrorHandler(objectStoreClient)
	)

	.delete("/:id", authenticateSSOUser, checkUserSessionExists(), parseIdAsObjectId(), deleteById)

	.get("/:id/questions", parseIdAsObjectId(), getQuestionsById)

	// All resources on path
	.get("/path/*", getAllByPath);

export default router;
