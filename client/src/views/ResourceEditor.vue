<template>
	<div class="resource-editor">
		<p v-if="pathFetchError">Error: {{ pathFetchError }}</p>
		<div v-else class="content-wrapper">
			<PathBreadcrumbs :pathItems="collectionsPath" :displayEditButton="false" class="breadcrumbs"></PathBreadcrumbs>

			<div class="content-area">
				<h1>Resource Editor</h1>

				<ErrorMessage :message="message" :messageStyles="messageStyles" />
				<ResourceActions :isCollectionRoot="isCollectionRoot" @save="saveResource" @delete="deleteResource" />
				<ResourceForm v-model:resourceLabel="resourceLabel" v-model:tagsAsString="tagsAsString"
					v-model:resourcePermissionsInternalHide="resourcePermissionsInternalHide
						" :item="item" @thumbnailChanged="thumbnailHandler" />

				<!-- Render ReorderResources if resource is a collection or topic bundle with atleast one child present -->
				<ReorderResources v-if="isCollectionOrTopicBundle &&
					childrenLoaded &&
					item.content.children.length > 0
					" :children="children" @reordered="reorderHandler"></ReorderResources>
			</div>
		</div>
		<!-- Show ResourceDisplay to preview content when *not* a collection or topic bundle -->
		<ResourceDisplay v-if="!isCollectionOrTopicBundle && resourceLoaded" :showCloseButton="false" :autoplay="false"
			:item="item" :isEditPreviewMode="true"></ResourceDisplay>
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
} from "@/types/Resource";
import type { SuccessMessage } from "@/types/SuccessMessage";
import { createAuthObjectIfNotExist } from "@/utils/Permission";

import ResourceDisplay from "@/components/resource/display/ResourceDisplay.vue";
import ErrorMessage from "@/components/resource/ErrorMessage.vue";
import ResourceActions from "@/components/resource/edit/ResourceActions.vue";
import ResourceForm from "@/components/resource/edit/ResourceForm.vue";

import type { Status } from "@/utils/Resources";
import { statusTypes } from "@/utils/Resources";

import ReorderResources from "@/components/resource/ReorderResources.vue";
import PathBreadcrumbs from "@/components/resource/PathBreadcrumbs.vue";

import { AxiosError, AxiosResponse } from "axios";

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

export default defineComponent({
	name: "ResourceEditor",
	components: {
		ResourceDisplay,
		ReorderResources,
		PathBreadcrumbs,
		ErrorMessage,
		ResourceActions,
		ResourceForm,
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
			resourceToChange: {
				_id: "",
			} as IResource_FromServer,

			formData: new FormData(),

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
				this.resourceToChange.label = val.trim();
			},
		},

		tagsAsString: {
			get() {
				return this.item.tags.join(",");
			},
			set(text: string) {
				this.resourceToChange.tags = text.trim().split(",");
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
				this.resourceToChange.permissions.auth![AuthMechanism.uqsso]![
					"basic"
				] = enabled;
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
				this.resourceToChange.permissions = this.item.permissions;
				this.resourceToChange.permissions.auth![
					AuthMechanism.internal
				]!["hidden"] = hide;
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
				return this.resourceToChange.label || this.item.label;
			},
			set(label: string) {
				this.resourceToChange.label = label;
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
		(async () => {
			try {
				const id = cleanPaths(to.params.pathMatch).pop();
				if (id === undefined || id.length === 0) {
					throw new Error("No ID could be extracted from path");
				}

				next(async (vm: any) => {
					const item = await vm.fetchItem(id);
					const childrenDataArray = await vm.fetchChildren(item);
					const previousQuiz = item
						? item
						: ({} as IResource_Quiz_UQ_Chem);

					vm.setupComponent(
						vm,
						item,
						childrenDataArray,
						previousQuiz
					);
				});
			} catch (e) {
				console.log(e);
				alert("Could not retrieve requested resource");
			}
		})();
	},
	methods: {
		/** Fetches resource by ID */
		async fetchItem(id: string) {
			const result = await Api.Resource.getById(id);
			let item = result.data;

			const quiz = await Api.Resource.convertQuiz(item);
			if (quiz) {
				Api.Resource.appendKeysToQuiz(quiz as IResource_Quiz_UQ_Chem);
				item = quiz;
			}

			return item;
		},
		/** Fetches children of resource */
		async fetchChildren(item: any) {
			if (
				item.content.children &&
				typeof item.content.children[0] !== "object"
			) {
				const children: string[] = item.content.children;
				const childrenResponses = await Promise.all(
					children.map((childId) => Api.Resource.getById(childId))
				);
				return childrenResponses.map((response) => response.data);
			}
			return undefined;
		},
		/** Sets up component with data */
		setupComponent(
			vm: any,
			item: any,
			childrenDataArray: IResource_FromServer[] | undefined,
			previousQuiz: IResource_Quiz_UQ_Chem
		) {
			createAuthObjectIfNotExist(item);
			vm.item = item;
			vm.previousQuiz = previousQuiz;
			vm.resourceLoaded = true;

			if (childrenDataArray !== undefined) {
				vm.assignChildren(childrenDataArray);
			}

			vm.setupBreadcrumbs();
		},
		/** Event handler for capturing thumbnail changes */
		thumbnailHandler(thumbnail: any) {
			this.resourceToChange.thumbnail = thumbnail;
		},

		reorderHandler(newChildren: IResource_FromServer[]) {
			const newChildrenIds = newChildren.map(
				(child: IResource_FromServer) => child._id
			);
			this.resourceToChange.content = { children: [...newChildrenIds] };
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
			const failureMessages = this.validateResourceLabel();
			const editComponentMessages =
				this.validateComponent("edit-component");
			const thumbnailComponentMessages = this.validateComponent(
				"thumbnail-edit-component"
			);

			const combinedMessages = [
				...failureMessages,
				...editComponentMessages,
				...thumbnailComponentMessages,
			];

			return {
				success: combinedMessages.length === 0,
				messages: combinedMessages,
			};
		},

		validateResourceLabel(): string[] {
			if (this.resourceLabel.trim().length === 0) {
				const messageStr = "Title is empty";
				this.setResourceLabelMessage(false, [messageStr]);
				return [messageStr];
			}
			return [];
		},

		validateComponent(refName: string): string[] {
			const component = this.$refs[refName] as any;
			if (component && component.validate) {
				const { messages = [] } = component.validate();
				return messages;
			}
			return [];
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
				this.message = statusTypes.deleteError;
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

		/** Prepares resource payload and makes API calls to save resource */
		async saveResource() {
			try {
				const successMessage = this.validate();
				if (!successMessage.success) return;

				const uploadHookMessage = await this.preUploadHook();
				if (!uploadHookMessage.success) return;

				const item = this.prepareItemForUpdate();

				this.cleanupResourceObject(item);

				const result = await Api.Resource.updateById(
					JSON.parse(JSON.stringify(this.item))._id,
					item,
					this.formData
				);

				this.updateItemWithResponse(result);

				this.message = statusTypes.postSuccess;
			} catch (e) {
				// TODO: Handle errors!
				this.message = statusTypes.postError;
			}
		},
		/**
		 * Prepares item for upload
		 */
		prepareItemForUpdate() {
			console.log(JSON.parse(JSON.stringify(this.item)));
			const item = JSON.parse(JSON.stringify(this.resourceToChange));

			item.content = this.item.content;

			if (
				this.resourceToChange.thumbnail &&
				this.resourceToChange.thumbnail.file
			) {
				item.thumbnail.file = new File(
					[this.resourceToChange.thumbnail.file],
					this.resourceToChange.thumbnail.file.name
				);
			};

			if (item.thumbnail === null) {
				item.thumbnail = {
					url: "",
				};
			};


			if (item.thumbnail) {
				this.prepareThumbnail(item);
			}

			return item;
		},
		/**
		 * Prepares thumbnail for upload
		 * @param item Resource object
		 */
		prepareThumbnail(item: IResource_FromServer) {
			if (
				item.thumbnail.url !== undefined &&
				item.thumbnail.url !== null
			) {
				item.thumbnail = {
					url: item.thumbnail.url,
					size: "cover",
				};
			} else if (item.thumbnail.file) {
				this.formData.append(
					"thumbnailUploadFile",
					item.thumbnail.file
				);
			} else if (typeof item.thumbnail.timeToTakeFrame === "number") {
				item.thumbnail = {
					timeToTakeFrame: item.thumbnail.timeToTakeFrame,
				};
			}
		},
		/**
		 * Updates item with response from API
		 * @param result AxiosResponse object
		 */
		async updateItemWithResponse(result: AxiosResponse) {
			const updatedResource = await Api.Resource.convertQuiz(result.data);

			if (updatedResource) {
				Api.Resource.appendKeysToQuiz(updatedResource);
				this.item = updatedResource;
			} else {
				this.item = result.data;
			}
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
