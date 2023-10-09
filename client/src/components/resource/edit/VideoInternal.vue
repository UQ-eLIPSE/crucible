<template>
	<div class="resource-edit-video field">
		<label>
			<span class="field-label">Video file</span>
			<div
				v-if="videoMessage"
				class="inline-message-box"
				:class="videoMessageClasses"
			>
				{{ videoMessageOutput }}
			</div>
			<FileSelector
				v-if="isNewUpload"
				v-model:files="videoFiles"
				:multiple="false"
				:smallButton="true"
				:mimeType="'video/*'"
				:buttonLabel="'Select a video file'"
			></FileSelector>

			<!-- Input is readonly, text gets selected on click -->
			<input
				v-else
				type="text"
				readonly
				@click="selectField($event)"
				v-model="resourceEdit.content.url"
			/>
		</label>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { SuccessMessage } from "@/types/SuccessMessage";
import {
	IResource_Video_Internal,
	IResource_Video_Internal_FromServer,
} from "@/types/Resource";

import FileSelector from "@/components/FileSelector.vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "VideoInternal",
	components: {
		FileSelector,
	},
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<
				IResource_Video_Internal | IResource_Video_Internal_FromServer
			>,
			required: true,
		},
		/** Indicates if this component is in "edit mode" or not */
		isEdit: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["update:resource"],
	data() {
		return {
			videoMessage: undefined as SuccessMessage | undefined,

			mimeType: "video/*",
		};
	},
	computed: {
		resourceEdit: {
			get() {
				return this.resource as IResource_Video_Internal_FromServer;
			},
			set(resource: IResource_Video_Internal_FromServer) {
				this.$emit("update:resource", resource);
			},
		},
		videoFiles: {
			get() {
				// We need to return an array rather than a File object because
				// FileSelector always uses an array for its input, regardless of
				// whether it has "multiple" on or not
				const resource = this.resource as IResource_Video_Internal;

				if (resource.content.file === undefined) {
					return [];
				}

				return [resource.content.file];
			},
			set(files: File[]) {
				const resource = this.resource as IResource_Video_Internal;

				resource.content.file = files[0];

				// Remove any message once someone attempts a change
				this.clearVideoMessage();
			},
		},

		videoMessageClasses() {
			const classes: string[] = [];

			if (this.videoMessage !== undefined) {
				classes.push(
					this.videoMessage.success ? "positive" : "negative"
				);
			}

			return classes;
		},

		videoMessageOutput() {
			return (
				this.videoMessage &&
				this.videoMessage.messages &&
				this.videoMessage.messages.join("; ")
			);
		},

		isNewUpload() {
			return !this.isEdit;
		},
	},
	methods: {
		validate() {
			// For new video uploads, we need a file defined
			if (this.isNewUpload) {
				const resource = this.resource as IResource_Video_Internal;

				if (resource.content.file === undefined) {
					return this.setVideoMessage(false, [
						"No video file has been selected",
					]);
				}

				if (!this.isValidVideoFile(resource.content.file.type)) {
					return this.setVideoMessage(false, [
						"Please select valid video files",
					]);
				}
			}

			this.clearVideoMessage();

			// Successful validation
			const message: SuccessMessage = {
				success: true,
			};

			return message;
		},

		/** Checks whether a valid video file has been chosen */
		isValidVideoFile(fileType: string) {
			return fileType.split("/")[0] === this.mimeType.split("/")[0];
		},

		clearVideoMessage() {
			this.videoMessage = undefined;
		},

		setVideoMessage(success: boolean, messages: string[]) {
			return (this.videoMessage = {
				success,
				messages,
			});
		},

		/** Selects the contents of the input field */
		selectField(e: MouseEvent) {
			(e.currentTarget as HTMLInputElement).select();
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";

/* Makes readonly inputs look like disabled */

input[readonly] {
	border-color: darkgrey;
	border-style: solid;
	border-width: 1px;
	background-color: rgb(235, 235, 228);
	color: rgb(84, 84, 84);
}
</style>
