<template>
	<div class="quiz-dropdown-option">
		<div class="quiz-option-header">
			<p>Option {{ index + 1 }}</p>
			<div>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="removeOption()"
				>
					Remove
				</button>
			</div>
		</div>
		<select v-model="optionEdit.optionCorrect">
			<option :value="true">Correct</option>
			<option :value="false">Incorrect</option>
		</select>

		<Tinymce
			class="tinymce"
			:id="editorId"
			:options="tinyMceOptions"
			v-model="optionEdit.optionValue"
		/>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import Tinymce from "@/components/Tinymce.vue";
import { tinyMCEOptions } from "@/utils/TinyMce";
import { getUniqueId } from "@/utils/UniqueId";
import { QuestionOption } from "@/types/Resource";
import { defineComponent } from "vue";
import { PropType } from "vue";

export default defineComponent({
	name: "QuizOption",
	components: {
		Tinymce,
	},
	props: {
		/** Input resource item */
		option: {
			type: Object as PropType<QuestionOption>,
			required: true,
		},
		index: {
			type: Number,
			required: true,
		},
	},
	emits: ["update:option", "removeOption"],
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
		optionEdit: {
			get() {
				return this.option;
			},
			set(question: QuestionOption) {
				this.$emit("update:option", question);
			},
		},
		/** Returns options for TinyMCE */
		tinyMceOptions() {
			const options: any = { ...tinyMCEOptions };
			options.file_picker_callback = this.tinyMceFilePicker;
			options.images_upload_url = this.editorImageUploadApiPath;
			options.automatic_uploads = true;
			options.force_br_newlines = false;
			return options;
		},
	},
	methods: {
		removeOption() {
			this.$emit("removeOption", this.option);
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
