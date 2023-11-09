<template>
	<div class="quiz-dropdown-option">
		<div class="quiz-option-header">
			<p>Hint #{{ index + 1 }}</p>
			<div>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="removeHint()"
				>
					Remove
				</button>
			</div>
		</div>

		<Tinymce
			class="tinymce"
			:id="editorId"
			:options="tinyMceOptions"
			v-model="hintEdit.content"
		/>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import Tinymce from "@/components/Tinymce.vue";
import { tinyMCEOptions } from "@/utils/TinyMce";
import { getUniqueId } from "@/utils/UniqueId";
import { QuestionAdditionalHint } from "@/types/Resource";
import { defineComponent, PropType } from "vue";
import Config from "../../../../../config.json";
export default defineComponent({
	name: "QuizHint",
	components: {
		Tinymce,
	},
	props: {
		/** Input resource item */
		hint: {
			type: Object as PropType<QuestionAdditionalHint>,
			required: true,
		},
		index: {
			type: Number,
			required: true,
		},
	},
	emits: ["update:hint", "removeHint"],
	data() {
		return {
			editorId: "",
			/** Passed to TinyMCE for sending a post request to the server with a new image */
			editorImageUploadApiPath: "api/resource/editorImages/blob",
			imageMimeType: "image/*",
		};
	},
	created() {
		this.editorId = getUniqueId();
	},
	computed: {
		hintEdit: {
			get() {
				return this.hint;
			},
			set(hint: QuestionAdditionalHint) {
				this.$emit("update:hint", hint);
			},
		},
		/** Returns options for TinyMCE */
		tinyMceOptions() {
			const options: any = { ...tinyMCEOptions };
			options.file_picker_callback = this.tinyMceFilePicker;
			options.images_upload_url = `${Config.API_URL}/${this.editorImageUploadApiPath}`;
			options.automatic_uploads = true;
			options.force_br_newlines = false;
			return options;
		},
	},
	methods: {
		removeHint() {
			this.$emit("removeHint", this.hint);
		},

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

.quiz-dropdown-option {
	border: 1px solid #a1a1a1;
	border-radius: 4px;
	padding: 1rem;
	margin: 0.5rem 0 0.5rem;
}

.quiz-option-header {
	display: flex;
	justify-content: space-between;
}
</style>
