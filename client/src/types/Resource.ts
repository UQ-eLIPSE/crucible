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
	/** Internal key used for Vue components to keep track of objects */
	_key?: number;
	type: Type;
	label: string;
	tags: string[];
	thumbnail: any; // TODO: Support for thumbnails not yet present

	permissions: Permissions_FromServer;

	// TODO: Proper interface shapes; because the resource objects here are not
	// the same as those stored on the server, we need to create another set of
	// interfaces which will most likely be similar but differ in things like
	// file references (actual File object v.s. path to Manta) etc.
	content: any;
}

export interface IResource_FromServer extends IResource_Base {
	_id: string;
}

export interface IResource_Document_Internal extends IResource_Base {
	content: {
		html: string;
	};
}

export interface IResource_Document_External extends IResource_Base {
	content: {
		url: string;
	};
}

export interface IResource_Video_Internal extends IResource_Base {
	content: {
		file: File | undefined;
	};
}

export interface IResource_Video_Internal_FromServer
	extends IResource_FromServer {
	content: {
		url: string;
	};
}

export interface IThumbnailUpload {
	file?: any;
	url?: any;
}

export interface IResource_Url extends IResource_Base {
	content: {
		url: string;
	};
}

/**
 * Smart Quiz with collection of Inline Documents to display with the questions
 */
export interface IResource_Smart_Quiz extends IResource_FromServer {
	type: Type.RESOURCE_COLLECTION_SMART_QUIZ;
	content: {
		children: IResource_Quiz_Question[];
		numQuestions: number;
		tags: string[];
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
	QUIZ_QUESTION_ADDITIONAL_HINT,
}
/**
 * Quiz containing a list of questions (with ID)
 *  - Used only in client as IResource_Quiz_UQ_Chem_Database is
 *  converted to IResource_Quiz_UQ_Chem in client
 */
export interface IResource_Quiz_UQ_Chem extends IResource_FromServer {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		questionList: IResource_Quiz_Question[];
	};
}

/**
 *	Quiz from server with array of children question IDS
 */
export interface IResource_Quiz_UQ_Chem_Database extends IResource_FromServer {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		children: string[];
	};
}

/**
 * Used when creating a quiz (without ID)
 */
export interface IResource_Quiz_UQ_Chem_Create extends IResource_Base {
	type: Type.QUIZ_UQ_CHEM;
	content: {
		numQuestions: number;
		questionList: IResource_Quiz_Question[];
	};
}

/**
 * Single question resource from server (with ID)
 */
export interface IResource_Quiz_Question extends IResource_FromServer {
	type: Type.QUIZ_QUESTION;
	content: MultipleChoiceQuestion | QuestionModule;
}

/**
 * Single question resource to create
 */
export interface IResource_Quiz_Question_Create {
	type: Type.QUIZ_QUESTION;
	content: MultipleChoiceQuestion | QuestionModule;
}

export interface GenericQuestion {
	statement: string | undefined;
	hint: string | undefined;
	additionalHints: QuestionAdditionalHint[];
	additionalInformation: string | undefined;
}
export interface MultipleChoiceQuestion_Server extends GenericQuestion {
	type: QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION;
	optionsList: QuestionOption[];
	_key: string;
}

export interface MultipleChoiceQuestion extends MultipleChoiceQuestion_Server {
	currentState: {
		alreadySelectedOptions: QuestionOption[];
		correctAnswerFound: boolean;
	};
}

export interface QuestionModule_Server extends GenericQuestion {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE;
	questionModuleList: (
		| QuestionDropdown
		| QuestionFreeTextInput
		| QuestionInputText
	)[];
	_key: string;
}

export interface QuestionModule extends QuestionModule_Server {
	currentState: {
		attemptedNumber: number;
		correctAnswerFound: boolean;
	};
}

export interface QuestionOption_Server {
	type:
		| QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN_OPTION
		| QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION_OPTION;
	optionValue: string | undefined;
	optionCorrect: boolean;
	_key: string;
}

export interface QuestionOption extends QuestionOption_Server {
	currentState: string;
}

export interface QuestionAdditionalHint {
	type: QUIZ_TYPES.QUIZ_QUESTION_ADDITIONAL_HINT;
	content: string;
	_key: string;
}

export interface QuestionFreeTextInput_Server {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT;
	correctAnswer: string | undefined;
	marginError: string;
	unit: string;
	_key: string;
}

export interface QuestionFreeTextInput extends QuestionFreeTextInput_Server {
	currentState: string;
}

export interface QuestionInputText {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT;
	questionText: string | undefined;
	_key: string;
}

export interface QuestionDropdown_Server {
	type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN;
	optionsList: QuestionOption[];
	_key: string;
}

export interface QuestionDropdown extends QuestionDropdown_Server {
	currentState: QuestionOption | undefined;
}

// -------------------------------- Authentication ---------------------------------------
export enum AuthMechanism {
	uqsso = "uqsso",
	internal = "internal",
}

interface uqssoAuthConfig {
	basic: boolean;
	staffOnly?: boolean;
}

interface internalAuthConfig {
	hidden?: boolean;
}

export interface IAuthConfig {
	[AuthMechanism.uqsso]?: uqssoAuthConfig;
	[AuthMechanism.internal]?: internalAuthConfig;
}

export interface Permissions_FromServer {
	/** Indicates that the resource is locked (e.g. when not logged in) */
	_currentlyLocked?: boolean;

	/** Auth services in order of priority */
	auth?: IAuthConfig;
}
