<template>
	<div class="resource-creator-resource">
		<!-- Resource delete button -->
		<button
			v-if="showRemoveButton"
			class="button secondary small remove-item-button"
			@click.prevent="removeThisResource()"
		>
			Remove
		</button>

		<div class="field">
			<label>
				<span class="field-label">Type</span>
				<select v-model="resourceType">
					<option
						v-for="typeObj in resourceTypesMap"
						:key="typeObj.resourceType"
						:value="typeObj.resourceType"
					>
						{{ typeObj.label }}
					</option>
				</select>
			</label>
		</div>

		<div class="field">
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
		</div>

		<div class="field">
			<label>
				<span class="field-label">Tags</span>
				<input
					type="text"
					v-model="tagsAsString"
					placeholder="Enter comma separated tags..."
				/>
			</label>
		</div>

		<div class="field">
			<label>
				<ResourceThumbnail
					:resource="resource"
					ref="thumbnail-edit-component"
					@thumbnailChanged="thumbnailHandler"
				></ResourceThumbnail>
			</label>
		</div>

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
				v-if="!isPermissionApplicable(resource, authMechanism.uqsso)"
			>
				<em
					>"{{
						(
							getTypeObjectByResourceType(resource.type) || {
								label: "Current resource ",
							}
						).label
					}}" type resource cannot be locked with UQ SSO</em
				>
			</label>

			<label
				v-show="isPermissionApplicable(resource, authMechanism.uqsso)"
			>
				<input
					type="checkbox"
					v-model="resourcePermissionsUqsso"
					class="standard-width"
				/>
				<span>Enforce UQ SSO login to view this resource</span>
			</label>
			<label
				v-if="resourcePermissionsUqsso"
				class="indented"
				v-show="isPermissionApplicable(resource, authMechanism.uqsso)"
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
			:is="getResourceEditComponent(resource.type)"
			ref="edit-component"
			:resource="resource"
		></component>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import type { SuccessMessage } from "@/types/SuccessMessage";
import {
	Type as ResourceType,
	IResource_Base,
	AuthMechanism,
	QuestionModule,
	MultipleChoiceQuestion,
} from "@/types/Resource";
import { createAuthObjectIfNotExist } from "@/utils/Permission";
import Url from "@/components/resource/edit/Url.vue";
import VideoInternal from "@/components/resource/edit/VideoInternal.vue";
import ResourceThumbnail from "@/components/resource/edit/Thumbnail.vue";
import DocumentInternal from "@/components/resource/edit/DocumentInternal.vue";
import DocumentExternal from "@/components/resource/edit/DocumentExternal.vue";
import QuizUq from "@/components/resource/edit/quiz/QuizUq.vue";
import ServiceExternalLti from "@/components/resource/edit/ServiceExternalLti.vue";
import { defineComponent, PropType } from "vue";
import clone from "just-clone";
import set from "just-safe-set";
import SmartQuizQuestion from "../display/quiz/SmartQuizQuestion.vue";

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
	{
		resourceType: ResourceType.RESOURCE_COLLECTION_SMART_QUIZ,
		label: "Smart Quiz",
		component: SmartQuizQuestion,
	},
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

export default defineComponent({
	name: "ResourceCreate",
	components: {
		ResourceThumbnail,
	},
	props: {
		/** Resource received from ResourceCreator */
		resource: {
			type: Object as PropType<IResource_Base>,
			required: true,
		},
		/** Whether to display the "remove" button */
		showRemoveButton: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["update:resource", "removeResource"],
	data() {
		return {
			resourceLabelMessage: undefined as SuccessMessage | undefined,
		};
	},
	mounted() {
		createAuthObjectIfNotExist(this.resource);
	},
	computed: {
		resourceTypesMap() {
			return RESOURCE_MAP;
		},

		thumbnail() {
			return this.resource.thumbnail;
		},

		tagsAsString: {
			get() {
				return this.resource.tags.join(",");
			},
			set(text: string) {
				this.$emit("update:resource", {
					...this.resource,
					tags: text.trim().split(","),
				});
			},
		},

		resourceLabel: {
			get() {
				return this.resource.label;
			},
			set(label: string) {
				this.$emit("update:resource", {
					...this.resource,
					label: label,
				});

				// Remove any message once someone attempts a change
				this.clearResourceLabelMessage();
			},
		},

		resourceType: {
			get() {
				return this.resource.type;
			},
			set(type: ResourceType) {
				// When we set a type that is different to the current type, we need to
				// reset the object content

				// If type hasn't changed, don't do anything
				if (type === this.resource.type) {
					return;
				}

				// Overwrite content and permissions depending on type - this is
				// required otherwise the subcomponents don't pick up on any of the
				// object properties which don't match theirs, leading to broken
				// reactivity

				let content: any;
				let permissions: any | undefined;

				switch (type) {
					case ResourceType.URL: {
						content = { url: "https://www.elipse.uq.edu.au" };
						break;
					}

					case ResourceType.DOCUMENT_INTERNAL: {
						content = { html: "<h1>Title</h1><p>Paragraph</p>" };
						break;
					}

					case ResourceType.VIDEO_INTERNAL: {
						content = { file: undefined }; // (File | undefined) for the video file handle
						break;
					}

					case ResourceType.DOCUMENT_EXTERNAL: {
						content = { url: "https://www.elipse.uq.edu.au" };
						break;
					}

					case ResourceType.QUIZ_UQ_CHEM: {
						content = { questionList: [] };
						break;
					}

					case ResourceType.QUIZ_QUESTION: {
						content = {} as QuestionModule | MultipleChoiceQuestion;
						break;
					}

					case ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL: {
						content = {
							html: "<h1>Note (Inline document)</h1><h2>Notes will not appear in the side content panel for the site. They will appear inline with the resource list in the collection</h2>",
						};
						break;
					}

					case ResourceType.SERVICE_EXTERNAL_LTI: {
						content = {
							launchUrl: "",
							consumerKey: "",
							secret: "",
						};
						break;
					}

					default:
						throw new Error("Unknown type");
				}

				if (permissions !== undefined) {
					this.$emit("update:resource", {
						...this.resource,
						permissions: permissions,
					});
				}

				this.$emit("update:resource", {
					...this.resource,
					content: content,
					type: type,
				});
			},
		},

		resourcePermissionsUqsso: {
			get() {
				return !!(
					this.resource.permissions.auth &&
					this.resource.permissions.auth![AuthMechanism.uqsso] &&
					this.resource.permissions.auth[AuthMechanism.uqsso]!.basic
				);
			},
			set(enabled: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.uqssoAuthObject) return;
				// Set the deep property basic for resource
				let new_resource = clone(this.resource);
				set(
					new_resource,
					`permissions.auth.${AuthMechanism.uqsso}.basic`,
					enabled
				);
				this.$emit("update:resource", new_resource);
			},
		},

		authObject() {
			if (
				!this.resource ||
				!this.resource.permissions ||
				!this.resource.permissions.auth
			)
				return null;
			return this.resource.permissions.auth;
		},

		uqssoAuthObject() {
			if (
				!this.resource ||
				!this.resource.permissions ||
				!this.resource.permissions.auth
			)
				return null;
			return this.resource.permissions.auth[AuthMechanism.uqsso];
		},

		internalAuthObject() {
			if (
				!this.resource ||
				!this.resource.permissions ||
				!this.resource.permissions.auth
			)
				return null;
			return this.resource.permissions.auth[AuthMechanism.internal];
		},

		resourcePermissionsUqssoStaffOnly: {
			get(): boolean {
				return !!(
					this.resource.permissions.auth &&
					this.resource.permissions.auth![AuthMechanism.uqsso]! &&
					this.resource.permissions.auth![AuthMechanism.uqsso]!
						.basic &&
					this.resource.permissions.auth![AuthMechanism.uqsso]!
						.staffOnly
				);
			},
			set(staffOnly: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.uqssoAuthObject) return;
				// Set the deep property staffOnly for resource
				let new_resource = clone(this.resource);
				set(
					new_resource,
					`permissions.auth.${AuthMechanism.uqsso}.staffOnly`,
					staffOnly
				);
				this.$emit("update:resource", new_resource);
				//Vue.set(this.resource.permissions.auth![AuthMechanism.uqsso]!, "staffOnly", staffOnly);
			},
		},

		resourcePermissionsInternalHide: {
			get(): boolean {
				return !!(
					this.resource.permissions.auth &&
					this.resource.permissions.auth![AuthMechanism.internal] &&
					this.resource.permissions.auth![AuthMechanism.internal]!
						.hidden
				);
			},
			set(hide: boolean) {
				// Cannot do anything if auth object not initialized
				if (!this.internalAuthObject) return;
				// Set the deep property hidden for resource
				let new_resource = clone(this.resource);
				set(
					new_resource,
					`permissions.auth.${AuthMechanism.internal}.hidden`,
					hide
				);
				this.$emit("update:resource", new_resource);
			},
		},

		/**
		 * Returns if resource item is an LTI launch resource
		 */
		isServiceExternalLti() {
			return this.resource.type === ResourceType.SERVICE_EXTERNAL_LTI;
		},

		/**
		 * Returns if resource item is an inline document
		 */
		isInlineDocumentInternal() {
			return (
				this.resource.type ===
				ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
		},

		/**
		 * Returns if resource item is a Link (URL)
		 */
		isLinkResource() {
			return this.resource.type === ResourceType.URL;
		},

		authMechanism() {
			return AuthMechanism;
		},

		resourceLabelMessageOutput() {
			return (
				this.resourceLabelMessage &&
				this.resourceLabelMessage.messages &&
				this.resourceLabelMessage.messages.join("; ")
			);
		},
	},
	methods: {
		/** Validates resource on submit by parent */
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
				(this.$refs["edit-component"] as any).validate ||
				(() => ({ success: true }))
			)();

			const thumbnailComponentValidationSuccess: SuccessMessage = (
				(this.$refs["thumbnail-edit-component"] as any).validate ||
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

		/** Executes pre-upload hooks before upload */
		async preUploadHook(): Promise<SuccessMessage> {
			// Run hooks for every child component
			const editComponentPreUploadHooksMessage: SuccessMessage = await (
				(this.$refs["edit-component"] as any).preUploadHook ||
				(() => ({ success: true }))
			)();

			// Combine messages sent by all child components
			const combinedMessages = [
				...(editComponentPreUploadHooksMessage.messages || []),
			];

			// If there are any messages, this means that hooks have failed
			if (!combinedMessages.length) {
				return {
					success: true,
				};
			} else {
				return {
					success: false,
					messages: combinedMessages,
				};
			}
		},

		thumbnailHandler(thumbnail: any) {
			this.$emit("update:resource", {
				...this.resource,
				thumbnail: thumbnail,
			});
		},

		/**
		 * Removes resource.
		 * Emits "removeResource" event to parent
		 */
		removeThisResource() {
			this.$emit("removeResource", this.resource);
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
			const typeObj = RESOURCE_MAP.find(
				(x) => x.resourceType === resourceType
			);
			return typeObj;
		},

		isPermissionApplicable(
			item: IResource_Base,
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

		clearResourceLabelMessage() {
			this.resourceLabelMessage = undefined;
		},

		setResourceLabelMessage(success: boolean, messages: string[]) {
			return (this.resourceLabelMessage = {
				success,
				messages,
			});
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";

.resource-creator-resource {
	position: relative;
}

.remove-item-button {
	position: absolute;
	top: 2rem;
	right: 2rem;
	z-index: 1;
}

.remove-item-button:hover,
.remove-item-button:active {
	background-color: #d11a2a;
	color: #fff;
}

.indented {
	margin: 0.5rem 1.3rem;
}

.indented::before {
	content: "-";
	font-size: 1.2em;
	font-weight: bold;
	color: rgba(1, 0, 0, 0.5);
}

.info {
	color: #17a2b8;
}
</style>
