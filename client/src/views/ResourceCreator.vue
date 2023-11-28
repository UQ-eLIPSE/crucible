<template>
	<div class="resource-creator">
		<PathBreadcrumbs
			class="breadcrumbs"
			:pathItems="collectionsPath"
			:displayEditButton="false"
		></PathBreadcrumbs>
		<div class="resource-choice">
			<h1>Create a new</h1>
			<div class="toggle">
				<button
					type="button"
					class="toggle-item"
					:class="activeResourceClass"
					@click.prevent="switchToResourceCreator"
					cy-data="create-resource-button"
				>
					resource
				</button>
				<button
					type="button"
					class="toggle-item"
					:class="activeCollectionClass"
					@click.prevent="switchToCollectionCreator"
					cy-data="create-collection-button"
				>
					collection
				</button>
			</div>
		</div>

		<p v-if="pathFetchError">Error: {{ pathFetchError }}</p>
		<!-- If user wants to create collection -->

		<div
			v-show="!isCreatedResource && !pathFetchError"
			class="content-area"
		>
			<div class="collection-controls">
				<h1>New Collection</h1>
				<button
					class="button"
					cy-data="create-button"
					@click.prevent="uploadCollection"
				>
					Create
				</button>
			</div>
			<AlertDisplay
				class="alert-display"
				v-model:alert-manager="collectionAlertManagerState"
			></AlertDisplay>
			<CreatorCollection
				ref="resource-creator-collection"
				v-model:collection="collection"
			></CreatorCollection>
		</div>

		<!-- If user wants to create resource -->

		<div
			v-show="isCreatedResource && !pathFetchError"
			class="content-area"
		>
			<h1>New Resource</h1>
			<!-- Resource alerts -->
			<AlertDisplay
				class="alert-display"
				v-model:alert-manager="resourceAlertManagerState"
			></AlertDisplay>
			<div class="uploading">
				<div
					v-for="(resource, index) in uploadingResources"
					:key="index"
					class="uploading-message"
				>
					Uploading {{ resource.label }}
					<div class="spinner spinner-slow spinner-purple"></div>
				</div>
			</div>
			<div class="main-controls">
				<div>
					<!-- Singular "add resource item" button -->
					<button
						class="button"
						@click.prevent="addNewResource"
					>
						Add
					</button>
					<!-- Add multiple files -->
					<FileSelectorOneWay
						:multiple="true"
						:label="'Add from file(s)...'"
						@selectedFiles="onFileSelect"
					></FileSelectorOneWay>
				</div>
				<div>
					<button
						class="button secondary"
						v-if="hasResources && showRemoveButton"
						@click.prevent="clearAllResources"
						:disabled="resourceControlButtonsDisabled"
					>
						Clear All
					</button>

					<button
						class="button"
						v-if="hasResources"
						:disabled="resourceControlButtonsDisabled"
						@click.prevent="uploadResources"
					>
						Save and Upload
					</button>
				</div>
			</div>
			<div class="resource-list">
				<CreatorResource
					v-for="(resource, index) in resources"
					ref="resource-creator-resource"
					class="resource-block"
					:key="resource._key"
					v-model:resource="resources[index]"
					:showRemoveButton="showRemoveButton"
					@removeResource="removeHandler"
				></CreatorResource>
			</div>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import type { SuccessMessage } from "@/types/SuccessMessage";
import {
	IResource_Quiz_Question,
	IResource_Quiz_UQ_Chem,
	IResource_Quiz_UQ_Chem_Database,
	Type as ResourceType,
} from "@/types/Resource";
import type {
	IResource_Base,
	IResource_FromServer,
	IThumbnailUpload,
} from "@/types/Resource";

import Api from "../api";
import FileSelectorOneWay from "@/components/FileSelectorOneWay.vue";
import CreatorResource from "@/components/resource/creator/Resource.vue";
import CreatorCollection from "@/components/resource/creator/Collection.vue";
import AlertDisplay from "@/components/AlertDisplay.vue";
import AlertManager from "@/utils/AlertManager";
import PathBreadcrumbs from "@/components/resource/PathBreadcrumbs.vue";
import { defineComponent } from "vue";
import { AxiosResponse, AxiosError } from "axios";

export default defineComponent({
	name: "ResourceCreator",
	components: {
		FileSelectorOneWay,
		CreatorResource,
		CreatorCollection,
		AlertDisplay,
		PathBreadcrumbs,
	},
	data() {
		return {
			/** Keeps track of added resources */
			resources: [] as IResource_Base[],

			/** Stores collection which has to be created */
			collection: {
				_key: performance.now(), // TODO: Proper ID generation
				type: ResourceType.RESOURCE_COLLECTION,
				label: "",
				tags: [],
				thumbnail: null as IThumbnailUpload | null,

				permissions: {},

				content: {
					children: [],
				},
			} as IResource_Base,

			/** Stores collection objects present on path */
			collectionsPath: [] as IResource_FromServer[],

			/** Alert manager for collection creation */
			collectionAlertManager: new AlertManager(),

			/** AlertManager for resource creation */
			resourceAlertManager: new AlertManager(),

			/** Boolean is true if user is creating resource and not collection */
			createResourceNotCollection: true,

			/** Stores resources that are uploading */
			uploadingResources: [] as IResource_Base[],

			/** Stores whether the resource's "Save and upload" button is disabled */
			resourceControlButtonsDisabled: false,

			pathFetchError: undefined as string | undefined,
		};
	},
	created() {
		this.fetchPathData(this.$route.params.pathMatch as string[]);

		// Create a new resource to begin with
		this.$nextTick(() => {
			this.addNewResource();
		});
	},
	computed: {
		activeCollection() {
			// Last collection in collections path
			return this.collectionsPath[this.collectionsPath.length - 1];
		},

		isCreatedResource: {
			get() {
				return this.createResourceNotCollection;
			},
			set(option: boolean) {
				if (option) {
					// resource was chosen
					if (option !== this.createResourceNotCollection) {
						// selection was changed from collection to resource
						this.createResourceNotCollection = option;
					}
				} else {
					// collection was chosen
					if (option !== this.createResourceNotCollection) {
						// selection was changed from resource to collection
						this.createResourceNotCollection = option;
					}
				}
			},
		},

		activeResourceClass() {
			return {
				selected: this.isCreatedResource,
			};
		},

		activeCollectionClass() {
			return {
				selected: !this.isCreatedResource,
			};
		},

		hasResources() {
			return this.resources.length;
		},

		resourceAlertManagerState() {
			return this.resourceAlertManager as AlertManager;
		},

		collectionAlertManagerState() {
			return this.collectionAlertManager as AlertManager;
		},

		showRemoveButton() {
			return this.resources.length > 1;
		},

		resourceCreatorCollection() {
			return this.$refs[
				"resource-creator-collection"
			] as typeof CreatorCollection;
		},
		resourceCreatorResourceArray() {
			return this.$refs[
				"resource-creator-resource"
			] as (typeof CreatorResource)[];
		},
	},
	methods: {
		/** Switches current creation mode to resource creation */
		switchToResourceCreator() {
			if (!this.isCreatedResource) {
				this.isCreatedResource = true;
			}
		},

		/** Switches current creation mode to collection creation */
		switchToCollectionCreator() {
			if (this.isCreatedResource) {
				this.isCreatedResource = false;
			}
		},

		/** Event handler to detect removal of ResourceCreatorResource component's instance */
		removeHandler(resource: IResource_Base) {
			const index = this.resources.indexOf(resource);
			if (index !== -1) {
				this.resources.splice(index, 1);
			}
		},

		/**
		 * Adds empty resource object to resources.
		 * "content" will be later replaced according to the selected resource type.
		 * Default new resource is video
		 */
		addNewResource() {
			this.resources.push({
				_key: performance.now(), // TODO: Proper ID generation
				type: ResourceType.VIDEO_INTERNAL,

				label: "",
				tags: [],
				thumbnail: undefined,

				permissions: {},

				content: {
					file: undefined,
				},
			});
		},
		/** Clears all resources */
		clearAllResources() {
			// Confirm to clear all resources if there is more than 1 resource
			if (
				!confirm("Are you sure ? All resource(s) data will be cleared")
			) {
				return false;
			}

			this.resources = [];

			// Insert blank new resource
			this.addNewResource();

			return true;
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

		clearCollection() {
			if (!confirm("Are you sure ? Collection data will be cleared")) {
				return false;
			}
			this.resetCollection();
			return true;
		},

		/** Sends AJAX Post request to server containing resource as FormData */
		async createResource(formData: FormData) {
			try {
				// TODO: Formalise the form data structure instead of implicitly
				// accepting it via. axios internally
				const resourceObject = JSON.parse(
					formData.get("resource") as string
				);

				this.uploadingResources.push(resourceObject);
				const result = await Api.Resource.insert(formData);

				return result;
			} catch (e) {
				const errorResource = this.resources.find((resource) => {
					const resourceJson = formData.get("resource") as string;
					const resourceJSONObject = JSON.parse(resourceJson);
					return (
						resource.label === resourceJSONObject.label &&
						resource.type === resourceJSONObject.type
					);
				});

				if (errorResource) {
					this.resourceAlertManager.resourceCreationError(
						errorResource.label
					);
					this.uploadingResources.splice(
						this.uploadingResources.indexOf(errorResource),
						1
					);
				}
				return;
			}
		},

		/** Uploads collection */
		uploadCollection() {
			const resourceCreatorCollection = this.resourceCreatorCollection;
			const successMessage: SuccessMessage =
				resourceCreatorCollection.validate();

			// Stop now if there are some validations which failed
			if (!successMessage.success) return;

			this.collectionAlertManager.clearMessages();

			// Prepare collection to be sent
			const resourceObject: IResource_Base = {
				tags: this.collection.tags,
				label: this.collection.label,
				type: this.collection.type,
				permissions: this.collection.permissions,
				content: this.collection.content,
				thumbnail: null,
			};

			const formData = new FormData();
			if (this.collection.thumbnail === null) {
				resourceObject.thumbnail = null;
			} else if (this.collection.thumbnail.url) {
				resourceObject.thumbnail = {
					url: this.collection.thumbnail.url,
					size: "cover",
				};
			} else if (this.collection.thumbnail.file) {
				formData.append(
					"thumbnailUploadFile",
					this.collection.thumbnail.file
				);
			}

			formData.append("resource", JSON.stringify(resourceObject));

			this.createCollection(formData).then((response: any) => {
				// Pass response (as array) to appendChildrenToParentResource
				this.appendChildrenToParentResource([response]);
			});
		},

		/** Sends AJAX Post request to server containing resource as FormData */
		async createCollection(formData: FormData) {
			try {
				const result = await Api.Resource.insert(formData);

				return result;
			} catch (e) {
				this.collectionAlertManager.resourceCreationError(
					"Collection could not be created"
				);
				throw new Error("Collection could not be created");
			}
		},

		async preUploadComponentHooks() {
			return await Promise.all(
				this.resourceCreatorResourceArray.map(async (c: any) => {
					if (c.preUploadHook) {
						return await c.preUploadHook();
					} else {
						return { success: true };
					}
				})
			);
		},

		/**
		 * Uploads resources to server.
		 * Maps resources to FormData[] and sends a post request to server
		 */
		async uploadResources() {
			// Go through entire list of editors and check that they're valid
			//Disable upload button while resources uploading

			this.uploadingResources = [];
			const successMessages: SuccessMessage[] =
				this.resourceCreatorResourceArray.map((component: any) =>
					component.validate()
				);

			// Stop now if there are some validations which failed
			if (successMessages.some((x) => !x || !x.success)) return;

			// Execute custom pre-upload hooks for components
			const uploadHookOutcomes = await this.preUploadComponentHooks();

			// Stop upload if any hook fails
			if (uploadHookOutcomes.some((x) => !x || !x.success)) return;

			// check if resources with mandatory files have some files chosen
			const uploadResources = this.resources.filter((resource) => {
				if (resource.type === ResourceType.VIDEO_INTERNAL) {
					return !!resource.content.file;
				}
				return true;
			});

			// A new object array is created with partial properties
			const objectList = await Promise.all(
				uploadResources.map(async (resource) => {
					// Think about three situations:
					// 1. No thumbnail whatsoever
					//     - null
					// 2. Thumbnail via. URL
					//     - no need to set the thumbnail in form
					// 3. Thumbnail via. file
					//     - no need to set `thumbnail` in the resource object
					const resourceObject: IResource_Base = {
						tags: resource.tags,
						label: resource.label,
						type: resource.type,
						permissions: resource.permissions,
						content: resource.content,
						thumbnail: null,
					};

					// Check if resource is a quiz and handle questions individually
					if (resourceObject.type === ResourceType.QUIZ_UQ_CHEM) {
						// Create new resource for each question
						const questions = await Promise.all(
							(
								resourceObject as IResource_Quiz_UQ_Chem
							).content.questionList
								.map(async (question) => {
									const formData = new FormData();
									formData.append(
										"resource",
										JSON.stringify(question)
									);
									const result = await this.createResource(
										formData
									);
									// Don't return results that failed to ensure the rest of the quiz
									// questions are still created
									return result
										? (result.data as IResource_Quiz_Question)
										: undefined;
								})
								.filter(
									(
										res
									): res is Promise<IResource_Quiz_Question> =>
										res !== undefined
								)
						);
						// Reassign questionList with new array of questions containing IDs
						(
							resourceObject as IResource_Quiz_UQ_Chem
						).content.questionList = questions;
						const objectIds = Api.Resource.combineQuestionIDs(
							(resourceObject as IResource_Quiz_UQ_Chem).content
								.questionList
						);
						// Remove questionList array and replace with object Ids
						delete resourceObject.content.questionList;

						// Add array of question IDs to parent quiz (converts it to IResource_Quiz_UQ_Chem_Database format)
						(
							resourceObject as IResource_Quiz_UQ_Chem_Database
						).content.children = objectIds;
					}

					const formData = new FormData();

					if (resource.thumbnail === null) {
						resourceObject.thumbnail = null;
					}
					if (resource.thumbnail) {
						if (resource.thumbnail.url) {
							resourceObject.thumbnail = {
								url: resource.thumbnail.url,
								size: "cover",
							};
						}
						if (resource.thumbnail.file) {
							formData.append(
								"thumbnailUploadFile",
								resource.thumbnail.file
							);
						}
						if (
							typeof resource.thumbnail.timeToTakeFrame ===
							"number"
						) {
							resourceObject.thumbnail = {
								timeToTakeFrame:
									resource.thumbnail.timeToTakeFrame,
							};
						}
					}

					formData.append("resource", JSON.stringify(resourceObject));

					if (resource.content.file) {
						formData.append(
							"videoUploadFile",
							resource.content.file
						);
					}

					return formData;
				})
			);

			// Disable save and upload button while resources are uploading (Also clear all button)
			this.resourceControlButtonsDisabled = true;
			const results = objectList.map((formData) => {
				return this.createResource(formData);
			});

			// Waits for all promises stored in results
			// "results.map" present so that Promise.all doesn't fail completely if one of the promises was rejected
			Promise.all(
				results.map((promise) => promise.catch((): any => undefined))
			).then((createdObjectsResponse) => {
				// Since all promises (whether resolved / rejected) will be passed on,
				// filter out the undefined promises for resource creation
				const successFullCreatedObjectsReponse =
					createdObjectsResponse.filter(
						(res: any) => res !== undefined
					);

				// Append children to parent resource
				this.appendChildrenToParentResource(
					successFullCreatedObjectsReponse
				).then(() => {
					this.uploadingResources = [];
					// Enable upload button when all upload progress is completed
					this.resourceControlButtonsDisabled = false;
				});
			});
		},

		/** Add newly created children resources to parent resource */
		appendChildrenToParentResource(createdObjectsResponse: any[]) {
			// Extract successfully created resources from response
			const createdChildren = createdObjectsResponse.filter(
				(response) => {
					return response !== undefined;
				}
			);

			// Get ids of successfully created resources
			const newChildResourcesIds = createdChildren.map((resource) => {
				return resource.data._id;
			});

			// Get parent resource
			const parentResourcePromise = this.getParentResource();
			return parentResourcePromise.then((parentResourceResponse) => {
				// Extract parent resource object from response
				const parent = parentResourceResponse.data;

				// Push child resource ids to parent's children field
				parent.content.children.push(...newChildResourcesIds);

				// Update parent object with modified parent object (with new appended children)
				this.updateParentResource(parent, createdChildren);
			});
		},

		/** Updates parent object with added children  */
		updateParentResource(
			parent: IResource_FromServer,
			createdChildren: AxiosResponse[]
		) {
			const patchParentResponse = this.patchParent(parent);
			patchParentResponse.then((response) => {
				if (response.status === 200) {
					// If parent patched successfully, show successfully added message
					createdChildren.forEach((childResponse: AxiosResponse) => {
						const childObject = childResponse.data;
						if (this.isCreatedResource) {
							this.resourceAlertManager.postSuccessMessage(
								childObject.label
							);
						} else {
							this.collectionAlertManager.postSuccessMessage(
								childObject.label
							);
							// Reset collection
							this.resetCollection();
						}

						// Remove successfully added files from resource list
						this.resources.forEach((resource, i) => {
							if (
								childObject.label === resource.label &&
								childObject.type === resource.type
							) {
								this.resources.splice(i, 1);
							}
						});
					});
				}
			});
		},

		/** Clears the collection and sets to default values */
		resetCollection() {
			this.collection = {
				_key: performance.now(),
				type: ResourceType.RESOURCE_COLLECTION,
				label: "",
				tags: [],
				thumbnail: null,

				permissions: {},

				content: {
					children: [],
				},
			};
		},

		/** Sends patch request to API for parent resource (with modified children list)  */
		async patchParent(parent: any) {
			try {
				this.cleanupResourceObject(parent);
				return await Api.Resource.updateById(
					this.activeCollection._id,
					parent
				);
			} catch (e) {
				throw new Error("Parent resource could not be updated");
			}
		},

		/** Retrieve parent resource to which new resources have to be added */
		async getParentResource() {
			try {
				return await Api.Resource.getById(this.activeCollection._id);
			} catch (e) {
				// Could not get parent resource
				throw Error("Parent resource could not be retrieved");
			}
		},

		getFileType(file: File) {
			return file.type;
		},

		/** A mapping function for relating MIME types to respective ResourceTypes */
		getResourceTypeForMimeType(mimeType: string): ResourceType {
			const [mainType, subType] = mimeType.split("/");

			if (mainType === "video") {
				return ResourceType.VIDEO_INTERNAL;
			}
			if (mainType === "text" && subType === "html") {
				return ResourceType.DOCUMENT_INTERNAL;
			}

			// Return NULL ResourceType when no type is found
			return ResourceType.NULL;
		},

		/** Returns customised content based upon the current Resource Type selected by user */
		getTemplateContentForResourceType(
			resourceType: ResourceType,
			file?: File
		) {
			switch (resourceType) {
				case ResourceType.VIDEO_INTERNAL:
					return {
						file, // (File | undefined) for uploaded file
					};

				case ResourceType.DOCUMENT_INTERNAL: {
					const content = {
						html: "<h1>Title</h1><p>Paragraph</p>",
					};

					if (file) {
						const fileReader = new FileReader();

						fileReader.onload = (e: Event) => {
							content.html = (e.target as any).result as string;
						};

						fileReader.readAsText(file, "utf-8");
					}

					return content;
				}
			}

			throw new Error("Unknown type");
		},

		/**
		 * An event handler which is triggered when files are selected.
		 * @param files The array of files selected and emitted by FileSelectorOneWay
		 */
		onFileSelect(files: File[]) {
			files.forEach((file) => {
				// Check type of the file
				const type = this.getFileType(file);

				// Map out the MIME type -> ResourceType
				const resourceType = this.getResourceTypeForMimeType(type);
				const content = this.getTemplateContentForResourceType(
					resourceType,
					file
				);

				if (this.isDuplicateFile(file)) {
					// Warn user of identical files
					this.resourceAlertManager.duplicateWarning();
				}

				// Add new resource to resources based on resource type
				this.resources.push({
					_key: performance.now(),
					type: resourceType,

					label: "",
					tags: [],
					thumbnail: undefined,

					permissions: {},

					content,
				});
			});
		},

		/**
		 * Checks if duplicate file exists in resources
		 * Check if either the file is not defined (not chosen) and if resource file name and size are equal
		 */
		isDuplicateFile(file: File) {
			// Check if either the file is not defined (not chosen) and if resource file name and size are equal
			const newFiles = this.resources.filter(
				(resource) =>
					resource.content.file !== undefined &&
					resource.content.file.name === file.name &&
					resource.content.file.size === file.size
			);

			return !!(newFiles && newFiles.length);
		},

		async fetchPathData(paths: string[]) {
			// Strip first slash if present
			for (let path in paths) {
				if (path[0] === "/") {
					path = path.substring(1);
				}
			}

			try {
				const result = await Api.Resource.getPath(paths);
				const response: any = result.data;

				// Put data into component's private data
				const { collections } = response;

				this.collectionsPath = collections;
			} catch (e) {
				// Handle errors
				let errorMessage = "Unspecified error";

				if (e instanceof AxiosError && e.response) {
					errorMessage = e.response.data.error;
				}

				this.pathFetchError = errorMessage;

				this.collectionsPath = [];
			}
		},
	},
});
</script>

<!-- ####################################################################### -->
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/resource/ResourceCreator.css";
</style>
