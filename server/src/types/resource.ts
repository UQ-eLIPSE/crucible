import * as mongodb from "mongodb";

export enum Type {
	// =========================================================================
	// NOTE: **Always** supply an enum value! **DO NOT** change existing ones!
	//
	// This will allow you to move the order of the below definition around and
	// maintain backwards compatibility.
	// =========================================================================
	// NOTE: **Check that enum values are not duplicated!**
	//
	// TypeScript does not verify that your enum values are unique!
	// This is aligned with other languages, but you need to be careful.
	// =========================================================================

	// Special types
	NULL = 0,
	RESOURCE_COLLECTION_ROOT = 1, // Root collections
	RESOURCE_COLLECTION = 2, // All other collections
	RESOURCE_COLLECTION_TOPIC_BUNDLE = 3, // Special topic bundle collection
	RESOURCE_COLLECTION_SMART_QUIZ = 4, // Collection of quiz questions

	// Document - e.g. a full HTML fragment
	DOCUMENT_INTERNAL = 10,
	DOCUMENT_EXTERNAL = 11,

	// URL - purely a link
	URL = 20,

	// // Images
	// IMAGE_INTERNAL = 30,
	// IMAGE_EXTERNAL = 31,

	// // Audio
	// AUDIO_INTERNAL = 40,
	// AUDIO_EXTERNAL = 41,

	// Video
	VIDEO_INTERNAL = 50, // Plain video
	VIDEO_EXTERNAL = 51, // Plain video, 3rd party
	VIDEO_EXTERNAL_KALTURA = 52, // Supports Kaltura explicitly

	// Resource explorer inline documents
	//   e.g. a paragraph floating at the top of a collection when viewed in
	//   frontend
	RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL = 60,

	// Connections to external services
	SERVICE_EXTERNAL_LTI = 70,

	// Quiz
	QUIZ_UQ_CHEM = 100, // UQ Chemistry practice problem format
	QUIZ_QUESTION = 101, // Standalone quiz question
}

export interface IResource_Base {
	_id?: mongodb.ObjectId;

	// type: Type;      // Each type is defined alongside their content interfaces below
	label: string;
	tags: string[];
	thumbnail: IThumbnailData | null;

	permissions: Permissions;
	_meta?: IResourceMetadata;
}

interface IResourceMetadata {
	hidden?: boolean;
}

export interface IThumbnailData {
	url: string;
	size: "contain" | "cover"; // Maps to `background-size` CSS property
}

export interface IThumbnailUpload {
	file: any;
	url: any;
}

// -------------------------------- Collections ---------------------------------------
/**
 * Collection of Resources in grid view
 */
export interface IResource_Collection {
	type: Type.RESOURCE_COLLECTION_ROOT | Type.RESOURCE_COLLECTION;
	content: {
		children: mongodb.ObjectId[];
	};
}

/**
 * Collection of Resources in list view
 */
export interface IResource_Collection_Topic_Bundle {
	type: Type.RESOURCE_COLLECTION_TOPIC_BUNDLE;
	content: {
		children: mongodb.ObjectId[];
	};
}

/**
 * Smart Quiz with collection of random questions
 */
export interface IResource_Smart_Quiz {
	type: Type.RESOURCE_COLLECTION_SMART_QUIZ;
	content: {
		children: mongodb.ObjectId[];
		numQuestions: number;
		tags: string[];
	};
}

// -------------------------------- Resources ---------------------------------------

export interface IResource_Document_Internal {
	type: Type.DOCUMENT_INTERNAL;
	content: {
		html: string;
	};
}

export interface IResource_Inline_Document_Internal {
	type: Type.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL;
	content: {
		html: string;
	};
}

export interface IResource_Document_External {
	type: Type.DOCUMENT_EXTERNAL;
	content: {
		url: string;
	};
}

export interface IResource_Url {
	type: Type.URL;
	content: {
		url: string;
	};
}

export interface IResource_Video_Internal {
	type: Type.VIDEO_INTERNAL;
	content: {
		url: string;
		contentRelativePath?: string;
	};
}

export interface IResource_Video_External_Kaltura {
	type: Type.VIDEO_EXTERNAL_KALTURA;
	content: {
		url: string;
	};
}

export interface IResource_Service_External_LTI {
	type: Type.SERVICE_EXTERNAL_LTI;
	content: {
		launchUrl: string;
		consumerKey: string;
		secret: string;
	};
}

// -------------------------------- Quiz ---------------------------------------
export enum QUIZ_TYPES {
	QUIZ_MULTIPLE_CHOICE_QUESTION,
	QUIZ_MULTIPLE_CHOICE_QUESTION_OPTION,
	QUIZ_QUESTION_MODULE,
	QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT,
	QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT,
	QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN,
	QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN_OPTION,
}

/**
 * Quiz containing a array of child questions
 */
export interface IResource_Quiz_UQ_Chem {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		children: mongodb.ObjectId[];
	};
}

/**
 * Quiz containing a array of child questions
 */
export interface IResource_Quiz_UQ_Chem_Old {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		questionList: (MultipleChoiceQuestion | QuestionModule)[];
	};
}

/**
 * Quiz from database containing a array of children
 */
export interface IResource_Quiz_UQ_Chem_Database {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		children: mongodb.ObjectId[];
	};
}

/**
 * Single question resource
 */
export interface IResource_Quiz_Question {
	type: Type.QUIZ_QUESTION;
	content: MultipleChoiceQuestion | QuestionModule;
}

export interface MultipleChoiceQuestion {
	type: QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION;
	hint: string | undefined;
	statement: string | undefined;
	optionsList: QuestionOption[];
	currentState: {
		alreadySelectedOptions: QuestionOption[];
		correctAnswerFound: boolean;
	};
	_key: string;
}

export interface QuestionModule {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE;
	questionModuleList: (
		| QuestionDropdown
		| QuestionFreeTextInput
		| QuestionInputText
	)[];
	statement: string | undefined;
	hint: string | undefined;
	currentState: {
		attemptedNumber: number;
		correctAnswerFound: boolean;
	};
	_key: string;
}

export interface QuestionOption {
	type:
		| QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN_OPTION
		| QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION_OPTION;
	optionValue: string | undefined;
	optionCorrect: boolean;
	currentState: string;
	_key: string;
}

export interface QuestionFreeTextInput {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT;
	correctAnswer: string | undefined;
	marginError: string;
	currentState: string;
	_key: string;
}

export interface QuestionInputText {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT;
	questionText: string | undefined;
	_key: string;
}

export interface QuestionDropdown {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN;
	optionsList: QuestionOption[];
	currentState: QuestionOption | undefined;
	_key: string;
}

// -------------------------------- Authentication ---------------------------------------
export enum AuthMechanism {
	uqsso = "uqsso",
	internal = "internal",
}

export interface IAuthConfig {
	uqsso?: uqssoAuthConfig;
	internal?: internalAuthConfig;
}

export interface Permissions {
	/** Auth services in order of priority */
	auth?: IAuthConfig;
}

interface uqssoAuthConfig {
	basic: boolean;
	staffOnly?: boolean;
}

interface internalAuthConfig {
	hidden?: boolean;
}

export type IResource = IResource_Base &
	(
		| IResource_Collection
		| IResource_Collection_Topic_Bundle
		| IResource_Smart_Quiz
		| IResource_Inline_Document_Internal
		| IResource_Service_External_LTI
		| IResource_Document_Internal
		| IResource_Document_External
		| IResource_Url
		| IResource_Video_Internal
		| IResource_Video_External_Kaltura
		| IResource_Quiz_UQ_Chem
		| IResource_Quiz_UQ_Chem_Database
		| IResource_Quiz_Question
		| IResource_Quiz_UQ_Chem_Old
	);

// All the interfaces that have children
export type IResourceChildren =
	| IResource_Collection
	| IResource_Collection_Topic_Bundle
	| IResource_Quiz_UQ_Chem
	| IResource_Quiz_UQ_Chem_Database
	| IResource_Smart_Quiz;
