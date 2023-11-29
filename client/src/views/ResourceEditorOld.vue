<template>
	<div class="resource-editor">
		<p v-if="pathFetchError">Error: {{ pathFetchError }}</p>
		<div
			v-else
			class="content-wrapper"
		>
			<PathBreadcrumbs
				:pathItems="collectionsPath"
				:displayEditButton="false"
				class="breadcrumbs"
			></PathBreadcrumbs>

			<div class="content-area">
				<h1>Resource Editor</h1>

				<div
					v-if="statusInstance"
					class="message"
					:class="messageStyles"
				>
					{{ message?.message }}
				</div>
				<div class="save-bar">
					<button
						class="button"
						@click.prevent="saveResource"
					>
						Save
					</button>

					<button
						class="button delete-button"
						v-if="!isCollectionRoot"
						@click.prevent="deleteResource"
					>
						Delete
					</button>
				</div>

				<ul class="property-list">
					<li class="field">
						<label>
							<span class="field-label">Title</span>
							<div
								v-if="resourceLabelMessage"
								class="inline-message-box negative"
							>
								{{ resourceLabelMessageOutput }}
							</div>
							<input
								type="text"
								v-model="resourceLabel"
							/>
						</label>
					</li>

					<li class="field">
						<label>
							<span class="field-label">Tags</span>
							<input
								type="text"
								v-model="tagsAsString"
								placeholder="Enter comma separated tags..."
							/>
						</label>
					</li>

					<!-- Thumbnail edit component -->
					<li class="field">
						<label>
							<Thumbnail
								v-if="resourceLoaded"
								:isEdit="true"
								:resource="item"
								ref="thumbnail-edit-component"
								@thumbnailChanged="thumbnailHandler"
							></Thumbnail>
						</label>
					</li>

					<!-- Hide resource -->
					<li class="field">
						<span class="field-label">Visibility</span>
						<label>
							<input
								type="checkbox"
								v-model="resourcePermissionsInternalHide"
								class="standard-width"
							/>
							<span>Hide resource</span>
						</label>
					</li>

					<!-- SSO permissions switch -->
					<li class="field">
						<span class="field-label">Permissions</span>
						<label
							class="info"
							v-if="
								!isPermissionApplicable(
									item,
									authMechanism.uqsso
								)
							"
						>
							<em
								>"{{
									(
										getTypeObjectByResourceType(
											item.type
										) || { label: "Current resource " }
									).label
								}}" type resource cannot be locked with UQ
								SSO</em
							>
						</label>
						<label
							v-show="
								isPermissionApplicable(
									item,
									authMechanism.uqsso
								)
							"
						>
							<input
								type="checkbox"
								v-model="resourcePermissionsUqsso"
								class="standard-width"
							/>
							<span
								>Enforce UQ SSO login to view this
								resource</span
							>
						</label>
						<label
							class="indented"
							v-show="
								resourcePermissionsUqsso &&
								isPermissionApplicable(
									item,
									authMechanism.uqsso
								)
							"
						>
							<input
								type="checkbox"
								v-model="resourcePermissionsUqssoStaffOnly"
								class="standard-width"
							/>
							<span>Only UQ Staff can view this resource</span>
						</label>
					</li>
					<component
						:is="getResourceEditComponent(item.type)"
						v-model:resource="item"
						ref="edit-component"
						:isEdit="true"
					></component>
				</ul>

				<!-- Render ReorderResources if resource is a collection or topic bundle with atleast one child present -->
				<ReorderResources
					v-if="
						isCollectionOrTopicBundle &&
						childrenLoaded &&
						item.content.children.length > 0
					"
					:children="children"
					@reordered="reorderHandler"
				></ReorderResources>
			</div>
		</div>
		<!-- Show ResourceDisplay to preview content when *not* a collection or topic bundle -->
		<ResourceDisplay
			v-if="!isCollectionOrTopicBundle && resourceLoaded"
			:showCloseButton="false"
			:autoplay="false"
			:item="item"
			:isEditPreviewMode="true"
		></ResourceDisplay>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import type { RouteLocationNormalized } from "vue-router";
import { defineComponent } from "vue";

import Api from "@/api";
import {
	Type as ResourceType,
	IResource_FromServer,
	IResource_Quiz_UQ_Chem,
	AuthMechanism,
	IResource_Base,
	IResource_Quiz_Question,
	IResource_Quiz_UQ_Chem_Database,
} from "@/types/Resource";
import type { SuccessMessage } from "@/types/SuccessMessage";
import { createAuthObjectIfNotExist } from "@/utils/Permission";

import ResourceDisplay from "@/components/resource/display/ResourceDisplay.vue";

import Url from "../components/resource/edit/Url.vue";
import VideoInternal from "../components/resource/edit/VideoInternal.vue";
import DocumentInternal from "../components/resource/edit/DocumentInternal.vue";
import DocumentExternal from "../components/resource/edit/DocumentExternal.vue";
import Thumbnail from "../components/resource/edit/Thumbnail.vue";
import ServiceExternalLti from "../components/resource/edit/ServiceExternalLti.vue";
import QuizUq from "../components/resource/edit/quiz/QuizUq.vue";

import ReorderResources from "@/components/resource/ReorderResources.vue";
import PathBreadcrumbs from "@/components/resource/PathBreadcrumbs.vue";

import { AxiosError } from "axios";

function cleanPaths(paths: string | string[]) {
	// These are indices for String#substr() with regards to stripping
	// unwanted characters from the paths, namely "/"
	let substringStart: number = 0;
	let substringEnd: number | undefined = undefined;

	let allPaths = [...paths];
	// Strip first slash if present
	for (let [i, path] of allPaths.entries()) {
		if (path[0] === "/") {
			allPaths[i] = path.substring(1);
		}
		// Strip last slash if present
		if (path[path.length - 1] === "/") {
			// Note that we're rewinding the indices from the end!
			substringEnd = -1;
			allPaths[i] = allPaths[i].slice(substringStart, substringEnd);
		}
	}

	return allPaths;
}

/** An array to map components to resource types */
const RESOURCE_MAP = [
	{
		resourceType: ResourceType.URL,
		label: "Link",
		component: Url,
	},
	{
		resourceType: ResourceType.DOCUMENT_INTERNAL,
		label: "Document (Editor)",
		component: DocumentInternal,
	},
	{
		resourceType: ResourceType.DOCUMENT_EXTERNAL,
		label: "Document (Link to external)",
		component: DocumentExternal,
	},
	{
		resourceType: ResourceType.QUIZ_UQ_CHEM,
		label: "Quiz",
		component: QuizUq,
	},

	/**
	 * KIM: Add your custom question display view here
	 * resourceType: ResourceType.QUIZ_QUESTION
	 */
	{
		resourceType: ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL,
		label: "Note (Inline document)",
		component: DocumentInternal,
	},
	{
		resourceType: ResourceType.VIDEO_INTERNAL,
		label: "Video (Upload)",
		component: VideoInternal,
	},
	{
		resourceType: ResourceType.SERVICE_EXTERNAL_LTI,
		label: "LTI Tool",
		component: ServiceExternalLti,
	},
];

interface Status {
	message: string;
	class: string;
}
interface StatusType {
	[key: string]: Status;
}

export default defineComponent({
	name: "ResourceEditor",
	components: {
		ResourceDisplay,
		Thumbnail,
		ReorderResources,
		PathBreadcrumbs,
	},
	data() {
		return {
			item: {
				_id: "",
				_key: 0,

				type: 0,
				label: "",
				tags: [],
				thumbnail: null,

				permissions: {},

				content: {},
			} as IResource_FromServer,

			/** Stores status types and css classes */
			statusTypes: {
				postSuccess: {
					message: "Updated successfully",
					class: "success",
				},
				postError: {
					message: "Error updating resource. Please try again.",
					class: "error",
				},
				deleteError: {
					message: "Resource could not be deleted. Please try again.",
					class: "error",
				},
				deleteSuccess: {
					message: "Resource has been deleted successfully.",
					class: "success",
				},
			} as StatusType,

			resourceLabelMessage: undefined as SuccessMessage | undefined,

			/** Stores collection objects present on path */
			collectionsPath: [] as IResource_FromServer[],

			/** Keeps track of editor status */
			statusInstance: undefined as Status | undefined,

			/** Tracks when async getById call completes (beforeRouteEnter) and item is fetched successfully */
			resourceLoaded: false,

			childrenLoaded: false,

			childrenResources: [] as IResource_FromServer[],

			/** Previous state of quiz used for performing diff checks on questions */
			previousQuiz: {} as IResource_Quiz_UQ_Chem,

			pathFetchError: undefined as string | undefined,
		};
	},
	computed: {
		children: {
			get() {
				return this.childrenResources;
			},
			set(childrenArray: IResource_FromServer[]) {
				this.childrenResources = childrenArray;
			},
		},

		authMechanism() {
			return AuthMechanism;
		},

		message: {
			get() {
				return this.statusInstance;
			},
			set(messageObject: Status) {
				this.statusInstance = messageObject;
			},
		},

		/** Returns style for alert */
		messageStyles() {
			if (!this.statusInstance) return;
			const statusClass = this.statusInstance.class;
			const styleObject: any = {};
			styleObject[statusClass] = true;
			return styleObject;
		},

		label: {
			get() {
				return this.item.label;
			},
			set(val: string) {
				this.item.label = val.trim();
			},
		},

		tagsAsString: {
			get() {
				return this.item.tags.join(",");
			},
			set(text: string) {
				this.item.tags = text.trim().split(",");
			},
		},

		resourcePermissionsUqsso: {
			get() {
				return !!(
					this.item.permissions.auth &&
					this.item.permissions.auth![AuthMechanism.uqsso] &&
					this.item.permissions.auth[AuthMechanism.uqsso]!.basic
				);
			},
			set(enabled: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.uqssoAuthObject) return;
				this.item.permissions.auth![AuthMechanism.uqsso]!["basic"] =
					enabled;
			},
		},

		authObject() {
			if (
				!this.item ||
				!this.item.permissions ||
				!this.item.permissions.auth
			)
				return null;
			return this.item.permissions.auth;
		},

		uqssoAuthObject() {
			if (
				!this.item ||
				!this.item.permissions ||
				!this.item.permissions.auth
			)
				return null;
			return this.item.permissions.auth[AuthMechanism.uqsso];
		},

		internalAuthObject() {
			if (
				!this.item ||
				!this.item.permissions ||
				!this.item.permissions.auth
			)
				return null;
			return this.item.permissions.auth[AuthMechanism.internal];
		},

		resourcePermissionsUqssoStaffOnly: {
			get(): boolean {
				return !!(
					this.item.permissions.auth &&
					this.item.permissions.auth![AuthMechanism.uqsso]! &&
					this.item.permissions.auth![AuthMechanism.uqsso]!.basic &&
					this.item.permissions.auth![AuthMechanism.uqsso]!.staffOnly
				);
			},
			set(staffOnly: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.uqssoAuthObject) return;
				this.item.permissions.auth![AuthMechanism.uqsso]!["staffOnly"] =
					staffOnly;
			},
		},

		resourcePermissionsInternalHide: {
			get(): boolean {
				return !!(
					this.item.permissions.auth &&
					this.item.permissions.auth![AuthMechanism.internal] &&
					this.item.permissions.auth![AuthMechanism.internal]!.hidden
				);
			},
			set(hide: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.internalAuthObject) return;
				this.item.permissions.auth![AuthMechanism.internal]!["hidden"] =
					hide;
			},
		},

		/**
		 * Returns if resource item is collection or topic bundle
		 */
		isCollectionOrTopicBundle() {
			switch (this.item.type) {
				case ResourceType.RESOURCE_COLLECTION:
				case ResourceType.RESOURCE_COLLECTION_ROOT:
				case ResourceType.RESOURCE_COLLECTION_SMART_QUIZ:
					return true;
				case ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE:
					return true;
			}

			return false;
		},

		isCollectionRoot() {
			return this.item.type === ResourceType.RESOURCE_COLLECTION_ROOT;
		},

		resourceLabel: {
			get() {
				return this.item.label;
			},
			set(label: string) {
				this.item.label = label;
				// Remove any message once someone attempts a change
				this.clearResourceLabelMessage();
			},
		},

		resourceLabelMessageOutput() {
			return (
				this.resourceLabelMessage &&
				this.resourceLabelMessage.messages &&
				this.resourceLabelMessage.messages.join("; ")
			);
		},
	},
	/**
	 * Loads resource information first before permitting navigation to this
	 * component
	 */
	beforeRouteEnter(
		to: RouteLocationNormalized,
		_from: RouteLocationNormalized,
		next: Function
	) {
		// We can't just make the `beforeRouteEnter` hook "async" due to type
		// conflicts, so instead we use an async IIFE as a wrapper inside the
		// body
		(async () => {
			try {
				// ID of the gotten resource is provided from the route
				const id = cleanPaths(to.params.pathMatch).pop();

				if (id === undefined || id.length === 0) {
					throw new Error("No ID could be extracted from path");
				}

				const result = await Api.Resource.getById(id);
				let item = result.data;

				let childrenDataArray: IResource_FromServer[] | undefined =
					undefined;

				// Check if resource is a Quiz and extract children questions
				const quiz = await Api.Resource.convertQuiz(item);
				let previousQuiz = {} as IResource_Quiz_UQ_Chem;

				// Resource is not a quiz so extract children
				if (!quiz) {
					// Check if resource contains children and children are not already objects
					if (
						item.content.children &&
						typeof item.content.children[0] !== "object"
					) {
						// If yes, fetch children as well
						const children: string[] = item.content.children;

						const childrenResponses = await Promise.all(
							children.map((childId) =>
								Api.Resource.getById(childId)
							)
						);

						childrenDataArray = childrenResponses.map(
							(response) => response.data
						);
					}
				} else {
					// Append current state to questions
					Api.Resource.appendKeysToQuiz(
						quiz as IResource_Quiz_UQ_Chem
					);
					item = quiz;
					// Store current state of quiz to use when performing diff check after edit
					previousQuiz = quiz;
				}

				// Note that the component has not actually been instantiated fully
				// at this point, so direct references to `this` are not valid.
				// Instead, we use `vm` with type any to refer to the component.
				next((vm: any) => {
					// Set the response object as the `item` for this component
					createAuthObjectIfNotExist(item);
					vm.item = item;
					vm.previousQuiz = previousQuiz;
					// Set resource loaded to true so that certain child components get item when it's loaded
					vm.resourceLoaded = true;

					if (childrenDataArray !== undefined) {
						vm.assignChildren(childrenDataArray);
					}

					vm.setupBreadcrumbs();
				});
			} catch (e) {
				// TODO: Handle errors!
				console.log(e);

				alert("Could not retrieve requested resource");
			}
		})();
	},
	methods: {
		isPermissionApplicable(
			item: IResource_FromServer,
			authMechanism: AuthMechanism
		) {
			if (!item) return false;
			switch (authMechanism) {
				case AuthMechanism.uqsso:
					// Permission is applicable for all resources except note or URL
					// Also, if item type does not exist, permission is not applicable
					return (
						item.type &&
						!(
							item.type === ResourceType.URL ||
							item.type ===
								ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
						)
					);
				case AuthMechanism.internal:
					// At the moment, any resource can be hidden
					// i.e. this permission is applicable to all resource types
					return true;
				default:
					return false;
			}
		},

		/** Event handler for capturing thumbnail changes */
		thumbnailHandler(thumbnail: any) {
			this.item.thumbnail = thumbnail;
		},

		reorderHandler(newChildren: IResource_FromServer[]) {
			const newChildrenIds = newChildren.map(
				(child: IResource_FromServer) => child._id
			);
			this.item.content.children = [...newChildrenIds];
		},
		createAuthObjectIfNotExist(resource: IResource_Base) {
			if (
				resource &&
				resource.permissions &&
				!resource.permissions.auth
			) {
				resource.permissions["auth"] = {};
				if (!resource.permissions.auth![AuthMechanism.uqsso]) {
					resource.permissions.auth![AuthMechanism.uqsso] = {
						basic: false,
						staffOnly: false,
					};
				}

				if (!resource.permissions.auth![AuthMechanism.internal]) {
					resource.permissions.auth![AuthMechanism.internal] = {
						hidden: false,
					};
				}
			}
		},
		assignChildren(childResourcesArray: IResource_FromServer[]) {
			this.children = childResourcesArray;
			this.childrenLoaded = true;
		},

		clearResourceLabelMessage() {
			this.resourceLabelMessage = undefined;
		},

		setResourceLabelMessage(success: boolean, messages: string[]) {
			return (this.resourceLabelMessage = {
				success,
				messages,
			});
		},

		/** Validates Editor and child components */
		validate(): SuccessMessage {
			const failureMessages: string[] = [];

			// Ensure that resource label is filled in
			if (this.resourceLabel.trim().length === 0) {
				const messageStr = "Title is empty";
				failureMessages.push(messageStr);

				this.setResourceLabelMessage(false, [messageStr]);
			}

			// We also check the editor component inside for its validity as well
			const editComponentValidationSuccess: SuccessMessage = (
				(this.$refs["edit-component"] &&
					(this.$refs["edit-component"] as any).validate) ||
				(() => ({ success: true }))
			)();

			const thumbnailComponentValidationSuccess: SuccessMessage = (
				(this.$refs["thumbnail-edit-component"] &&
					(this.$refs["thumbnail-edit-component"] as any).validate) ||
				(() => ({ success: true }))
			)();

			// Combine the two sets of messages
			const combinedMessages = [
				...failureMessages,
				...(editComponentValidationSuccess.messages || []),
				...(thumbnailComponentValidationSuccess.messages || []),
			];

			// If there are any messages, this means that validation failed
			if (combinedMessages.length > 0) {
				return {
					success: false,
					messages: combinedMessages,
				};
			} else {
				return {
					success: true,
				};
			}
		},

		/**
		 * Navigates to parent collection of current resource being edited
		 */
		goToParentCollection() {
			// NOTE: `this.$router.go(-1)` was not used since we cannot ascertain
			// that the last route was the parent collection and not the resource
			// itself (which is now deleted and will throw an error if access is
			// attempted).

			if (this.isCollectionRoot) {
				// Go to home if we're a collection root
				this.$router.push("/");
				return;
			}

			// Reconstruct the path to the parent collection
			const currentRoute = cleanPaths(this.$route.params.pathMatch);

			// Remove id of resource which is currently being edited
			currentRoute.pop();

			const parentPath = currentRoute.join("/");
			this.$router.push("/resource/" + parentPath);
		},

		/**
		 * Deletes the "item" resource and all its reference in parent resources.
		 * Does not recursively delete children resources if "item" resource is a collection
		 */
		async deleteResource() {
			// Ask to confirm first
			if (!confirm("Continue with deleting this resource?")) {
				return;
			}

			try {
				await Api.Resource.remove(this.item._id);

				// Return to parent after successful removal
				this.goToParentCollection();
			} catch (e) {
				this.message = this.statusTypes.deleteError;
			}
		},

		cleanupResourceObject: (resourceObject: any) => {
			for (const objKey in resourceObject) {
				const value = resourceObject[objKey];
				// Check if the value is null or an empty array
				if (
					value === null ||
					(Array.isArray(value) && value.length === 0)
				) {
					delete resourceObject[objKey];
				}
			}
		},

		removeKeys(obj: any, keys: any) {
			var index;
			for (var prop in obj) {
				// important check that this is objects own property
				// not from prototype prop inherited
				if (Object.prototype.hasOwnProperty.call(obj, prop)) {
					switch (typeof obj[prop]) {
						case "string":
							index = keys.indexOf(prop);
							if (index > -1) {
								delete obj[prop];
							}
							break;
						case "object":
							index = keys.indexOf(prop);
							if (index > -1) {
								delete obj[prop];
							} else {
								this.removeKeys(obj[prop], keys);
							}
							break;
					}
				}
			}
		},

		/**
		 * Add any questions that were added during editing and
		 * update all existing questions
		 * @param previousIds Array of object ids for unedited quiz
		 * @param quiz Edited quiz resource
		 * @returns Updated quiz
		 */
		async updateAddQuestions(
			previousIds: string[],
			quiz: IResource_Quiz_UQ_Chem
		) {
			const updatedQuiz = quiz;
			const updatedQuestions = await Promise.all(
				updatedQuiz.content.questionList.map(async (question) => {
					const formData = new FormData();
					this.cleanupResourceObject(question);
					formData.append("resource", JSON.stringify(question));
					// Check if question already existed in quiz
					const result =
						question._id && previousIds.includes(question._id)
							? await Api.Resource.updateById(
									question._id,
									question,
									formData
							  )
							: !question._id
							? // Question doesn't exist in database (doesn't contain an ID) so create it
							  await Api.Resource.insert(formData)
							: undefined;
					return result
						? (result.data as IResource_Quiz_Question)
						: question;
				})
			);

			// Update Quiz with updated question list
			updatedQuiz.content.questionList = updatedQuestions;

			return updatedQuiz;
		},

		/**
		 * Perform diff check to see if any question has been deleted from quiz
		 * @param previousIds Array of object ids for unedited quiz
		 * @param editedIds Array of object ids for edited quiz
		 * @param quiz Edited quiz resource
		 * @returns Updated quiz
		 */
		async removeQuestions(
			previousIds: string[],
			editedIds: string[],
			quiz: IResource_Quiz_UQ_Chem
		) {
			const updatedQuiz = quiz;
			// Compare IDs to check if any question has been deleted
			// Array contains IDs that have been deleted
			const questionIdDiff = previousIds.filter(
				(id) => !editedIds.includes(id)
			);

			// Delete all questions from database that were removed during edit
			for (const questionId of questionIdDiff)
				await Api.Resource.remove(questionId);

			// Remove child objects from quiz
			const updatedQuestions = updatedQuiz.content.questionList.filter(
				(question) => !questionIdDiff.includes(question._id)
			);
			updatedQuiz.content.questionList = updatedQuestions;

			return updatedQuiz;
		},

		/**
		 * This function handles quiz questions and
		 * removes temporary currentState propert from quiz
		 *
		 * - Deletes questions that were removed from quiz
		 * - Updates and adds questions
		 * @param item Edited quiz
		 * @returns Array of children question object IDs
		 */
		async convertQuizToServer(item: IResource_Quiz_UQ_Chem) {
			// Removes all `currentState` properties from a quiz
			// `currentState` is a temporary prop added to hold the state of quiz elements
			if (item.type === ResourceType.QUIZ_UQ_CHEM) {
				this.removeKeys(item.content, ["currentState"]);
			}

			let quiz = item;
			const editedQuestionIds = Api.Resource.combineQuestionIDs(
				item.content.questionList
			);
			const previousQuestionIds = Api.Resource.combineQuestionIDs(
				this.previousQuiz.content.questionList
			);

			// Delete questions that were removed from quiz
			quiz = await this.removeQuestions(
				previousQuestionIds,
				editedQuestionIds,
				quiz
			);

			// Update and add all children questions for quiz
			quiz = await this.updateAddQuestions(previousQuestionIds, quiz);

			const objectIds = Api.Resource.combineQuestionIDs(
				quiz.content.questionList
			);
			return objectIds;
		},

		/** Prepares resource payload and makes API calls to save resource */
		async saveResource() {
			// Validate this component and child components
			const successMessage: SuccessMessage = this.validate();

			// Stop now if there are some validations which failed
			if (successMessage.success === false) {
				return;
			}

			const uploadHookMessage: SuccessMessage =
				await this.preUploadHook();
			// Stop now if there are some hooks that failed
			if (uploadHookMessage.success === false) {
				return;
			}

			try {
				let item = JSON.parse(JSON.stringify(this.item));
				if (this.item.thumbnail && this.item.thumbnail.file) {
					item.thumbnail.file = new File(
						[this.item.thumbnail.file],
						this.item.thumbnail.file.name
					);
				}

				const resourceObject: IResource_Base = {
					type: item.type,
					label: item.label,
					tags: item.tags,
					permissions: item.permissions,
					content: item.content,
					thumbnail: item.thumbnail,
				};

				this.cleanupResourceObject(resourceObject);

				const formData = new FormData();

				if (item.thumbnail === null) {
					resourceObject.thumbnail = null;
				} else if (item.thumbnail) {
					if (
						item.thumbnail.url !== undefined &&
						item.thumbnail.url !== null
					) {
						resourceObject.thumbnail = {
							url: item.thumbnail.url,
							size: "cover",
						};
					} else if (item.thumbnail.file) {
						formData.append(
							"thumbnailUploadFile",
							item.thumbnail.file
						);
					} else if (
						typeof item.thumbnail.timeToTakeFrame === "number"
					) {
						resourceObject.thumbnail = {
							timeToTakeFrame: item.thumbnail.timeToTakeFrame,
						};
					}
				}

				this.cleanupResourceObject(resourceObject);

				const result = await Api.Resource.updateById(
					item._id,
					resourceObject,
					formData
				);

				// Force update this item's data
				const updatedResource = await Api.Resource.convertQuiz(
					result.data
				);
				// Quizzes have to be converted back to questionList array of children
				// questions and add the currentState properties back to display them
				if (updatedResource) {
					Api.Resource.appendKeysToQuiz(updatedResource);
					this.item = updatedResource;
				} else {
					this.item = result.data;
				}

				this.message = this.statusTypes.postSuccess;
			} catch (e) {
				// TODO: Handle errors!
				this.message = this.statusTypes.postError;
			}
		},

		/** Finds component based on resource type from RESOURCE_MAP */
		getResourceEditComponent(resourceType: ResourceType) {
			const typeObj = RESOURCE_MAP.find(
				(x) => x.resourceType === resourceType
			);

			// Either returns `undefined` if `typeObj === undefined`; otherwise the
			// `.component` value
			return typeObj && typeObj.component;
		},

		/** Finds type object based on resource type from RESOURCE_MAP */
		getTypeObjectByResourceType(resourceType: ResourceType) {
			return RESOURCE_MAP.find((x) => x.resourceType === resourceType);
		},

		/**
		 * Fetches collection resources using collection ids array
		 * @param ancestorCollectionIds Array of ancestor collections of the current resource being edited
		 */
		async fetchCollectionsForBreadcrumbs(ancestorCollectionsIds: string[]) {
			// If there are no ancestors (in the case of collection roots being
			// edited)
			if (ancestorCollectionsIds.length === 0) {
				this.collectionsPath = [];
				this.pathFetchError = undefined;
				return;
			}

			try {
				const result = await Api.Resource.getPath(
					ancestorCollectionsIds
				);
				const response: any = result.data;

				// Extract information about all collection ancestors into
				// `collectionsPath`
				this.collectionsPath = response.collections;
				this.pathFetchError = undefined;
			} catch (e) {
				// Handle errors
				let errorMessage = "Unspecified error";

				if (e instanceof AxiosError && e.response) {
					errorMessage = e.response.data.error;
				}

				// Clear out `collectionsPath`, set error message
				this.collectionsPath = [];
				this.pathFetchError = errorMessage;
			}
		},

		/**
		 * Gets path and extracts ancestor ids from path for displaying breadcrumbs
		 */
		setupBreadcrumbs() {
			// Gets route params
			// Used for displaying breadcrumbs
			const path = this.$route.params.pathMatch;
			const pathAncestorIds = cleanPaths(path);

			// Pop last element from `pathAncestorIds`
			// This removes the current resource's ID from the array so that
			// breadcrumbs only display ancestor collections
			if (!this.isCollectionOrTopicBundle) {
				pathAncestorIds.pop();
			}
			this.fetchCollectionsForBreadcrumbs(pathAncestorIds);
		},
		/** Executes pre-upload hooks before upload */
		async preUploadHook(): Promise<SuccessMessage> {
			// Run hooks for every child component
			const editComponentPreUploadHooksMessage: SuccessMessage = await (
				(this.$refs["edit-component"] &&
					(this.$refs["edit-component"] as any).preUploadHook) ||
				(() => ({ success: true }))
			)();

			// Combine messages sent by all child components
			const combinedMessages = [
				...(editComponentPreUploadHooksMessage.messages || []),
			];

			// If there are any messages, this means that hooks have failed
			if (combinedMessages.length > 0) {
				return {
					success: false,
					messages: combinedMessages,
				};
			} else {
				return {
					success: true,
				};
			}
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";
@import "@/assets/styles/resource/ResourceEditor.css";
</style>
