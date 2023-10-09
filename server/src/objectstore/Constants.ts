// File fieldnames
export const THUMBNAIL_FILE_FIELDNAME = "thumbnailUploadFile";
export const VIDEO_FILE_FIELDNAME = "videoUploadFile";
export const EDITOR_IMAGE_FILE_FIELDNAME = "file";
export const prependPathToFieldname = (fieldname: string) => {
	return "path_" + fieldname;
};

export const prependInfoToFieldname = (fieldname: string) => {
	return "info_" + fieldname;
};
