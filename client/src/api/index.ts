import { Type as ResourceType, QUIZ_TYPES } from "../types/Resource";
import * as AllResources from "../types/Resource";
import { v4 as getUniqueId } from "uuid";
import axios from "axios";
import Config from "../../config.json";

/*
 * Initialise Axios and set withCredentials on all requests
 *
 * TODO only apply credentials when active session exists
 * Active session in Vuex store gets reset on page refresh
 * Need to save session active state in a more permanent
 * storage in Frontend
 */
const axiosInstance = axios.create({
	withCredentials: true,
	baseURL: Config.API_URL,
});

namespace Api {
	/**
	 * Builds API URL by prefixing "/api" to path
	 *
	 * @param path Strings equal to path split over "/"
	 */
	export function buildApiUrl(...path: string[]) {
		return appendUrl("/api", ...path);
	}

	/**
	 * Appends given path to the end of the given URL
	 *
	 * @param url URL to append to
	 * @param path Strings equal to path to be appended split over "/"
	 */
	export function appendUrl(url: string, ...path: string[]) {
		return url + "/" + path.join("/");
	}

	const { get, post, patch, delete: _delete, put } = axiosInstance;

	export namespace Auth {
		const PARENT = buildApiUrl("auth");

		/**
		 * Creates POST request for local strategy login
		 *
		 * @param loginData Login data for local login
		 */
		export async function postLocalLogin(loginData: {
			username: string;
			password: string;
		}) {
			return await post(appendUrl(PARENT, "login", "local"), loginData);
		}

		/**
		 * Creates POST request for logout
		 */
		export async function postLogout() {
			return await post(appendUrl(PARENT, "logout"), {});
		}

		/**
		 * Creates GET request to fetch "who am I" information
		 */
		export async function getWhoAmI() {
			return await get(appendUrl(PARENT, "whoami"));
		}
	}

	export namespace Resource {
		const PARENT = buildApiUrl("resource");

		/**
		 * Creates CSV Download request to fetch data
		 */
		export async function getCSV() {
			return await get(appendUrl(PARENT, "dataDownload"));
		}

		/**
		 * Retrieve all reources in .JSON to render a tree graph
		 */
		export async function getGraph() {
			return await get(appendUrl(PARENT, "getTreeNode"));
		}

		export function cleanObjectOfUnderscoreProperties(obj: any) {
			// Remove all traces of properties starting with "_"
			Object.keys(obj).forEach((key) => {
				// Delete the key if it starts with "_"
				if (key[0] === "_") {
					delete obj[key];
					return;
				}

				// If the value at this key is an object, recurse
				if (obj[key] && typeof obj[key] === "object") {
					cleanObjectOfUnderscoreProperties(obj[key]);
				}
			});

			// Do not return; side effects present
		}

		/**
		 * Creates GET request to fetch all resources at the root
		 */
		export async function getRoot() {
			return await get(appendUrl(PARENT));
		}

		/**
		 * Creates GET request to fetch the contents of the resource located at
		 * the given path
		 *
		 * @param path Strings equal to path split over "/"
		 */
		export async function getPath(path: string[]) {
			const response = await get(appendUrl(PARENT, "path", ...path));
			response.data.children = await Promise.all(
				response.data.children.map(
					async (child: AllResources.IResource_FromServer) => {
						// Handle quiz format conversion
						const convertedQuiz = await convertQuiz(child);
						if (convertedQuiz) {
							appendKeysToQuiz(convertedQuiz);
							child = convertedQuiz;
						}
						// // Append keys to quiz questions
						if (child.type === AllResources.Type.QUIZ_QUESTION) {
							appendKeysToQuiz([
								child as AllResources.IResource_Quiz_Question,
							]);
						}
						return child;
					}
				)
			);
			return response;
		}

		export async function generateStateForQuestionModule(
			questionModule: AllResources.QuestionModule
		) {
			if (!questionModule || !questionModule.type) return;
			const modules = questionModule.questionModuleList;

			if (!modules || !modules.length) return;
			modules.forEach((mod) => {
				switch (mod.type) {
					case QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT:
						mod.currentState = "";
						break;
					case QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN:
						mod.currentState = undefined;
						break;
					default:
						break;
				}
			});
		}

		/**
		 * Appends "_key" property to certain children of a quiz type resource.
		 * Critical for successful rendering of quiz's internal components in ResourceDisplay and ResourceEditor.
		 * @param resource Resource received from server
		 */
		export function appendKeysToQuiz(
			resource:
				| AllResources.IResource_Quiz_UQ_Chem
				| AllResources.IResource_Quiz_Question[]
		) {
			// Resources is either a Quiz questionList or a Quiz Question array
			const resources = Array.isArray(resource)
				? (resource as AllResources.IResource_Quiz_Question[])
				: (resource as AllResources.IResource_Quiz_UQ_Chem).content
						.questionList;

			// For every quiz question:
			for (const question of resources) {
				// Generate UIDs for every quiz question
				question.content._key = getUniqueId();
				// Check if question is a multiple choice question
				if (
					question.content.type ===
					QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION
				) {
					question.content.currentState = {
						alreadySelectedOptions: [],
						correctAnswerFound: false,
					};

					// Generate UIDs for every option
					question.content.optionsList.forEach((option) => {
						option._key = getUniqueId();
						option.currentState = "";
					});
				}

				// Check if question is a modular question
				if (question.content.type === QUIZ_TYPES.QUIZ_QUESTION_MODULE) {
					question.content.currentState = {
						correctAnswerFound: false,
						attemptedNumber: 0,
					};

					generateStateForQuestionModule(question.content);
					// Generate UIDs for every question module
					question.content.questionModuleList.forEach(
						(questionModule) => {
							questionModule._key = getUniqueId();
							// Check if question module is a dropdown
							if (
								questionModule.type ===
								QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN
							) {
								// Generate UIDs for every drop down option
								questionModule.optionsList.forEach(
									(option: any) => {
										option._key = getUniqueId();
									}
								);
							}
						}
					);
				}
			}
			// Do not return; side effects present
		}

		/**
		 * Forces backend to refresh random questions for the smart quiz
		 * @param smartQuiz Smart Quiz to refresh questions for
		 */
		export async function getSmartQuizQuestions(
			smartQuiz: AllResources.IResource_Smart_Quiz
		) {
			return await get(appendUrl(PARENT, smartQuiz._id, "questions"));
		}
		/**
		 * Convert questionList of children questions to array of
		 * resource IDs
		 * @param quiz Edited quiz
		 */
		export function combineQuestionIDs(
			questions: AllResources.IResource_Quiz_Question[]
		): string[] {
			const childIds = questions.map((question) => {
				return question._id;
			});
			return childIds;
		}

		/**
		 * Convert quiz from object with array of children question IDs
		 * to
		 * questionList array of the entire question resources
		 *
		 * This is so that we can access the entire quiz question rather than
		 * just the Mongo IDs to display it in the quiz
		 * @param resource Resource received from the server
		 * @returns Quiz containing questionList array of children questions
		 */
		export async function convertQuiz(
			resource: AllResources.IResource_FromServer
		) {
			// Check if resource type is quiz resource or if resource is locked (i.e. content is empty)
			if (
				resource.type !== ResourceType.QUIZ_UQ_CHEM ||
				resource.permissions._currentlyLocked
			) {
				return;
			}
			// Don't convert format for quizzes that still use questionList
			if (
				(resource as AllResources.IResource_Quiz_UQ_Chem).content
					.questionList
			)
				return;

			const quiz =
				resource as AllResources.IResource_Quiz_UQ_Chem_Database;
			// Extract all children and save in questionList property

			const questionList = await Promise.all(
				quiz.content.children.map(async (child) => {
					const question = await getById(child);
					if (!question)
						console.error("Failed to get child question");
					return question.data as AllResources.IResource_Quiz_Question;
				})
			);

			const returnResource = {
				...quiz,
				content: {
					questionList: questionList,
				},
			} as AllResources.IResource_Quiz_UQ_Chem;
			return returnResource;
		}

		/**
		 * Creates GET request to fetch a specific resource
		 *
		 * @param id ID of the specific resource to fetch
		 */
		export async function getById(id: string) {
			const response = await get(appendUrl(PARENT, id));
			// Handle quiz format conversion and append keys to questions
			const convertedQuiz = await convertQuiz(response.data);
			if (convertedQuiz) appendKeysToQuiz(convertedQuiz);

			return response;
		}

		/**
		 * Creates PATCH/PUT request to update a specific resource
		 *
		 * @param id ID of the specific resource to update
		 * @param resource Updated resource content
		 * @param formData FormData for adding thumbnail
		 */
		export async function updateById(
			id: string,
			resource: any,
			formData?: FormData
		) {
			// Make a copy of the resource
			const resourceToUpload = { ...resource };

			// Get rid of underscore properties because they're meant to be
			// internal to the client
			cleanObjectOfUnderscoreProperties(resourceToUpload);

			if (formData && formData.get("thumbnailUploadFile")) {
				formData.append("resource", JSON.stringify(resourceToUpload));
				return await put(appendUrl(PARENT, id), formData);
			} else {
				return await patch(appendUrl(PARENT, id), resourceToUpload);
			}
		}

		/**
		 * Creates POST request to create a new resource
		 *
		 * @param resource New resource content
		 */
		export async function insert(resource: FormData) {
			// Extract `resource` from the form data and clean it
			const resourceToUpload = JSON.parse(
				resource.get("resource") as string
			);

			let queryParam = {};
			// Check if resource is a smart quiz and add number of questions to get to param
			if (
				resourceToUpload.type ===
				AllResources.Type.RESOURCE_COLLECTION_SMART_QUIZ
			)
				queryParam = {
					params: {
						num: (
							resourceToUpload as AllResources.IResource_Quiz_UQ_Chem_Create
						).content.numQuestions,
					},
				};

			// Get rid of underscore properties because they're meant to be
			// internal to the client
			cleanObjectOfUnderscoreProperties(resourceToUpload);

			// Replace resource in form data
			resource.set("resource", JSON.stringify(resourceToUpload));

			// Send to server
			return await post(appendUrl(PARENT), resource, queryParam);
		}

		/**
		 * Creates DELETE request to delete a specific resource
		 *
		 * @param id ID of the specific resource to delete
		 */
		export async function remove(id: string) {
			return await _delete(appendUrl(PARENT, id));
		}
	}

	export namespace User {
		const PARENT = buildApiUrl("user");

		/**
		 * Creates PATCH request to update the password for a specific user
		 *
		 * @param id ID of the specific user to update password for
		 * @param changePasswordData Change password data
		 */
		export async function changePasswordForId(
			id: string,
			changePasswordData: { old: string; new: string }
		) {
			return await patch(
				appendUrl(PARENT, id, "password"),
				changePasswordData
			);
		}
	}
}

export default Api;
