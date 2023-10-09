<template>
	<div class="resource-edit-document-internal field">
		<span class="field-label">Content</span>

		<Tinymce
			:id="editorId"
			:options="tinyMceOptions"
			v-model="resourceEdit.content.html"
		/>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_Document_Internal } from "@/types/Resource";
import Tinymce from "@/components/Tinymce.vue";
import tinymce from "tinymce";
import * as TinyMceUtils from "@/utils/TinyMce";
import { getUniqueId } from "@/utils/UniqueId";

export default defineComponent({
	name: "DocumentInternal",
	components: {
		Tinymce,
	},
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<IResource_Document_Internal>,
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
			imageMimeType: "image/*",

			/** Passed to TinyMCE for sending a post request to the server with a new image */
			editorImageUploadApiPath: "api/resource/editorImages/blob",

			editorId: "",
		};
	},
	created() {
		this.editorId = getUniqueId();
	},
	computed: {
		resourceEdit: {
			get() {
				return this.resource;
			},
			set(resource: IResource_Document_Internal) {
				this.$emit("update:resource", resource);
			},
		},
		/** Returns options for TinyMCE */
		tinyMceOptions() {
			// Set file picker callback
			const options: any = { ...TinyMceUtils.tinyMCEOptions };
			options.file_picker_callback = this.tinyMceFilePicker;
			options.images_upload_url = this.editorImageUploadApiPath;
			options.automatic_uploads = false;
			options.height = 400;
			return options;
		},
	},
	methods: {
		/** Event handler to trigger file picker for TinyMCE */
		tinyMceFilePicker(callback: Function) {
			const imageInput = document.createElement("INPUT");
			imageInput.setAttribute("type", "file");
			imageInput.setAttribute("accept", this.imageMimeType);
			imageInput.addEventListener("change", () => {
				const files = (imageInput as HTMLInputElement).files;
				if (!files || files.length <= 0 || !files[0]) {
					return;
				}

				const imageFile = files[0];
				if (!this.isValidImageFile(imageFile)) {
					return;
				}

				// Display image in TinyMCE
				callback(imageFile.name, {
					alt: imageFile.name,
					src: URL.createObjectURL(imageFile),
				});
			});

			imageInput.dispatchEvent(
				new MouseEvent("click", { bubbles: false })
			);
		},

		async preUploadHook() {
			return await TinyMceUtils.saveTinyMceEditorContent(
				tinymce,
				this.resource
			);
		},

		/** Checks if the chosen file is a valid image file */
		isValidImageFile(file: File | null | undefined) {
			if (!file) return false;
			return this.imageMimeType.split("/")[0] === file.type.split("/")[0];
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.save-editor-button {
	margin: 0.5rem 0 0.5rem;
}

.info {
	display: flex;
	justify-content: space-between;
	padding: 0.8rem;
	border-radius: 0.2rem;
	margin-top: 0.4rem;
	margin-bottom: 0.8rem;
	color: #31708f;
	background-color: #d9edf7;
	border-color: #bce8f1;
}

.info > span {
	align-self: center;
}
</style>
