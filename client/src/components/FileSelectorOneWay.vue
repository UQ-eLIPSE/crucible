<template>
	<div class="file-selector">
		<form ref="wrapper-form">
			<label>
				<input
					type="file"
					ref="input"
					:multiple="multiple"
					:accept="mimeType"
					class="input"
					@change="onFileChange"
				/>
				<button
					class="button gold"
					:class="{ small: smallButton }"
					@click.stop.prevent="openFileSelector"
				>
					{{ label }}
				</button>
			</label>
		</form>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
	name: "SelectorOneWay",
	props: {
		/** The MIME type for file acceptance criteria */
		mimeType: {
			type: String,
			required: false,
			default: "*",
		},
		/** Property to check if multiple file uploads are allowed */
		multiple: {
			type: Boolean,
			required: false,
			default: false,
		},
		/** Button label */
		label: {
			type: String,
			required: false,
			default: "Choose file(s)",
		},
		/** Whether to use a small button style or not */
		smallButton: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["selectedFiles"],
	methods: {
		onFileChange(e: Event) {
			const inputEl: HTMLInputElement = e.target as any;
			const fileList = inputEl.files;

			// Ignore blank file lists
			if (!fileList || fileList.length === 0) {
				return;
			}

			// Convert to nice File[], then send it up to parent
			const files = this.convertFileListToFileArray(fileList);
			this.emitFiles(files);

			// Reset the form to clear out the selected files in the input;
			// this is required because this component is merely for selecting
			// files and does not actually have a two-way binding on an array
			this.clearFiles();
		},

		convertFileListToFileArray(fileList: FileList) {
			// Equivalent to Array.from()
			const fileArray: File[] = [];

			for (let i = 0; i < fileList.length; i++) {
				fileArray.push(fileList[i]);
			}

			return fileArray;
		},

		clearFiles() {
			const wrapperForm = this.$refs["wrapper-form"] as HTMLFormElement;
			wrapperForm.reset();
		},

		emitFiles(files: ReadonlyArray<File>) {
			this.$emit("selectedFiles", files);
		},

		openFileSelector() {
			// Trigger a synthetic click to open the system file selection dialog
			(this.$refs["input"] as HTMLInputElement).click();
		},
	},
});
</script>

<style lang="scss" scoped>
.file-selector {
	display: inline-block;
}

form {
	display: inline-block;
}

.input {
	/**
	 * Hiding the input element, because we don't actually use the raw one 
	 * provided by the browser
	 */
	display: none;
}
</style>
