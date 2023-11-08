<template>
	<div class="quiz-questiontext">
		<div class="questiontext-header">
			<p>Start/continue question text</p>
			<div>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="removeQuestionModule()"
				>
					Remove
				</button>
			</div>
		</div>
		<Tinymce
			class="tinymce"
			:id="editorId"
			:options="tinyMceOptions"
			v-model="questionModuleEdit.questionText"
		/>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Tinymce from "@/components/Tinymce.vue";
import { tinyMCEOptions } from "@/utils/TinyMce";
import { QuestionInputText } from "@/types/Resource";
import { getUniqueId } from "@/utils/UniqueId";
import Config from "../../../../../config.json";

export default defineComponent({
	name: "ModuleQuestionInput",
	components: {
		Tinymce,
	},
	props: {
		/** Input resource item */
		questionModule: {
			type: Object as PropType<QuestionInputText>,
			required: true,
		},
	},
	emits: ["update:questionModule", "removeQuestionModule"],
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
		questionModuleEdit: {
			get() {
				return this.questionModule;
			},
			set(question: QuestionInputText) {
				this.$emit("update:questionModule", question);
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
		removeQuestionModule() {
			this.$emit("removeQuestionModule", this.questionModule);
		},

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

.quiz-questiontext {
	display: flex;
	flex-direction: column;
	border: 1px solid #afacb7;
	background-color: #fafafa;
	border-radius: 4px;
	padding: 1rem;
	margin: 0.5rem 0 0.5rem;
}

.questiontext-header {
	display: flex;
	justify-content: space-between;
}

.quiz-questiontext > p {
	font-weight: bold;
}
</style>
