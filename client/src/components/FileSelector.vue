<template>
	<div class="file-selector">
		<FileSelectorOneWay
			:mimeType="mimeType"
			:multiple="multiple"
			:label="buttonLabel"
			:smallButton="smallButton"
			@selectedFiles="onSelectedFiles"
		></FileSelectorOneWay>
		<span class="file-selection-text">{{ fileSelectionText }}</span>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import FileSelectorOneWay from "./FileSelectorOneWay.vue";

export default defineComponent({
	name: "FileSelector",
	components: {
		FileSelectorOneWay,
	},
	props: {
		/** The MIME type for file acceptance criteria */
		mimeType: {
			type: String,
			required: false,
		},
		/** Property to check if multiple file uploads are allowed */
		multiple: {
			type: Boolean,
			required: false,
		},
		/** Button label */
		buttonLabel: {
			type: String,
			required: false,
		},
		/** Selected files from v-model */
		files: {
			type: Array as PropType<ReadonlyArray<File>>,
			required: true,
		},
		/** Whether to use a small button style or not */
		smallButton: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["update:files"],
	computed: {
		fileSelectionText() {
			// Display file name for single files
			if (this.files.length === 1) {
				return this.files[0].name;
			}

			// Display the count otherwise
			return `${this.files.length} files selected`;
		},
	},
	methods: {
		/**
		 * Emits a "selectedFiles" event to parent component
		 * @param selectedFiles Files which were chosen from file selector
		 */
		onSelectedFiles(selectedFiles: ReadonlyArray<File>) {
			this.$emit("update:files", selectedFiles);
		},
	},
});
</script>

<style lang="scss" scoped>
.file-selector {
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
}

.file-selection-text {
	padding-left: 1rem;
	max-width: 80%;
	word-wrap: break-word;
}
</style>
