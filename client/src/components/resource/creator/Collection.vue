<template>
	<div class="resource-creator-collection">
		<div class="field">
			<label>
				<span class="field-label">Type</span>
				<select v-model="collectionEdit.type">
					<option :value="resourceTypes.RESOURCE_COLLECTION">
						Collection
					</option>
					<option
						:value="resourceTypes.RESOURCE_COLLECTION_TOPIC_BUNDLE"
					>
						Topic
					</option>
					<option
						:value="resourceTypes.RESOURCE_COLLECTION_SMART_QUIZ"
					>
						Smart Quiz
					</option>
				</select>
			</label>
		</div>

		<div class="field">
			<label>
				<span class="field-label">Title</span>
				<div
					v-if="collectionLabelMessage"
					class="inline-message-box negative"
				>
					{{ collectionLabelMessageOutput }}
				</div>
				<input
					type="text"
					v-model="label"
					cy-data="collection-title-field"
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
					:resource="collection"
					ref="thumbnail-edit-component"
					@thumbnailChanged="thumbnailHandler"
				></ResourceThumbnail>
			</label>
		</div>

		<div
			class="field"
			v-if="
				collectionEdit.type ===
				resourceTypes.RESOURCE_COLLECTION_SMART_QUIZ
			"
		>
			<label>
				<span class="field-label">Number of questions</span>
				<select v-model="collectionEdit.content.numQuestions">
					<option
						v-for="option in numQuestions"
						:value="option"
						:key="option"
					>
						{{ option }}
					</option>
				</select>
			</label>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import type { SuccessMessage } from "@/types/SuccessMessage";
import { IResource_Base, Type as ResourceType } from "@/types/Resource";

import ResourceThumbnail from "@/components/resource/edit/Thumbnail.vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "ResourceCollection",
	components: {
		ResourceThumbnail,
	},
	props: {
		/** The MIME type for file acceptance criteria */
		collection: {
			type: Object as PropType<IResource_Base>,
			required: true,
			default: () => ({
				_key: performance.now(),
				type:
					ResourceType.RESOURCE_COLLECTION |
					ResourceType.RESOURCE_COLLECTION_SMART_QUIZ,

				label: "",
				tags: [],
				thumbnail: null,

				permissions: {},

				content: {
					children: [],
				},
			}),
		},
	},
	emits: ["update:collection"],
	data() {
		return {
			collectionLabelMessage: undefined as SuccessMessage | undefined,
			numQuestions: [10, 20, 30, 40], // Options for number of questions dropdown (Smart Quiz)
		};
	},
	computed: {
		collectionEdit: {
			get() {
				return this.collection;
			},
			set(collection: IResource_Base) {
				this.$emit("update:collection", collection);
			},
		},
		resourceTypes() {
			return ResourceType;
		},

		thumbnail() {
			return this.collection.thumbnail;
		},

		label: {
			get() {
				return this.collection.label;
			},
			set(newLabel: string) {
				this.$emit("update:collection", {
					...this.collection,
					label: newLabel,
				});
				this.clearResourceLabelMessage();
			},
		},

		tagsAsString: {
			get() {
				return this.collection.tags.join(",");
			},
			set(text: string) {
				this.$emit("update:collection", {
					...this.collection,
					tags: text.trim().split(","),
				});
			},
		},

		collectionLabelMessageOutput() {
			return (
				this.collectionLabelMessage &&
				this.collectionLabelMessage.messages &&
				this.collectionLabelMessage.messages.join("; ")
			);
		},
	},
	watch: {
		// If creating a smart quiz	set default number of questions to 10
		"collectionEdit.type": {
			deep: true,
			handler: function (oldVal, newVal) {
				// Check if haven't already selected Smart Quiz in dropdown
				if (
					newVal !== oldVal &&
					newVal === ResourceType.RESOURCE_COLLECTION_SMART_QUIZ
				)
					this.collectionEdit.content.numQuestions =
						this.numQuestions[0];
			},
		},
	},
	methods: {
		thumbnailHandler(thumbnail: any) {
			this.$emit("update:collection", {
				...this.collection,
				thumbnail: thumbnail,
			});
		},

		clearResourceLabelMessage() {
			this.collectionLabelMessage = undefined;
		},

		setCollectionLabelMessage(success: boolean, messages: string[]) {
			return (this.collectionLabelMessage = {
				success,
				messages,
			});
		},

		validate(): SuccessMessage {
			const failureMessages: string[] = [];

			// Ensure that resource label is filled in
			if (this.collection.label.trim().length === 0) {
				const messageStr = "Title is empty";
				failureMessages.push(messageStr);

				this.setCollectionLabelMessage(false, [messageStr]);
			}

			const editComponentValidationSuccess: SuccessMessage = (
				(this.$refs["thumbnail-edit-component"] as any).validate ||
				(() => ({ success: true }))
			)();

			// Combine the two sets of messages
			const combinedMessages = [
				...failureMessages,
				...(editComponentValidationSuccess.messages || []),
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
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";
</style>
