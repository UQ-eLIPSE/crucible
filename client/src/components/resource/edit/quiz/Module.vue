<template>
	<div class="question-module">
		<div
			class="button accordion"
			:class="accordionStyle"
			@click.prevent="toggleQuestionContent()"
		>
			<span class="show-hide-text">{{
				toggleQuestionContentButtonText
			}}</span>
		</div>
		<div v-show="displayQuestionContent">
			<p>Problem Statement</p>
			<Tinymce
				class="tinymce"
				:id="editorId"
				:options="tinyMceOptions"
				v-model="questionEdit.statement"
			/>
			<div class="controls">
				<button
					type="button"
					class="button small secondary"
					@click.prevent="addQuestionTextField()"
				>
					+ Add question text
				</button>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="addFreeTextInputField()"
				>
					+ Add numerical input field
				</button>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="addDropdown()"
				>
					+ Add dropdown module
				</button>
			</div>
			<div class="question-modules">
				<template
					v-for="(child, index) in questionEdit.questionModuleList"
					:key="index"
				>
					<component
						class="module-component"
						:is="questionComponentType(child.type)"
						v-model:questionModule="
							questionEdit.questionModuleList[index]
						"
						@removeQuestionModule="removeQuestionModuleHandler"
					></component>
				</template>
			</div>
			<QuizHints
				v-model:additionalHints="questionEdit.additionalHints"
			></QuizHints>
			<p>Additional Information (Learning materials links)</p>
			<Tinymce
				class="tinymce"
				:id="additionalInformationEditorId"
				:options="tinyMceOptions"
				v-model="questionEdit.additionalInformation"
			/>
			<p>Solution & Explanation</p>
			<Tinymce
				class="tinymce"
				:id="hintEditorId"
				:options="tinyMceOptions"
				v-model="questionEdit.hint"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import ModuleDropDown from "./ModuleDropDown.vue";
import ModuleFreeTextInput from "./ModuleFreeTextInput.vue";
import ModuleQuestionInput from "./ModuleQuestionInput.vue";
import QuizHints from "./Hints.vue";
import Tinymce from "@/components/Tinymce.vue";
import { tinyMCEOptions } from "@/utils/TinyMce";
import {
	QUIZ_TYPES,
	QuestionModule,
	QuestionInputText,
	QuestionFreeTextInput,
	QuestionDropdown,
} from "@/types/Resource";
import { getUniqueId } from "@/utils/UniqueId";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "QuizModule",
	components: {
		Tinymce,
		QuizHints,
	},
	props: {
		question: {
			type: Object as PropType<QuestionModule>,
			required: true,
		},
	},
	emits: ["update:question"],
	data() {
		return {
			editorId: "",
			hintEditorId: "",
			additionalInformationEditorId: "",
			/** Passed to TinyMCE for sending a post request to the server with a new image */
			editorImageUploadApiPath: "api/resource/editorImages/blob",
			imageMimeType: "image/*",

			// Note: Modified directly by parent through setter
			showQuestionContent: false,
		};
	},
	created() {
		this.editorId = getUniqueId();
		this.hintEditorId = getUniqueId();
		this.additionalInformationEditorId = getUniqueId();
	},
	computed: {
		questionEdit: {
			get() {
				return this.question;
			},
			set(question: QuestionModule) {
				this.$emit("update:question", question);
			},
		},
		displayQuestionContent: {
			get() {
				return this.showQuestionContent;
			},
			// Note: Modified directly by parent
			set(display: boolean) {
				this.showQuestionContent = display;
			},
		},

		toggleQuestionContentButtonText() {
			return this.displayQuestionContent
				? "Hide question content"
				: "Show question content";
		},

		/** Returns options for TinyMCE */
		tinyMceOptions() {
			// Set file picker callback
			const options: any = { ...tinyMCEOptions };
			options.file_picker_callback = this.tinyMceFilePicker;
			options.images_upload_url = this.editorImageUploadApiPath;
			options.automatic_uploads = true;
			return options;
		},

		accordionStyle() {
			return {
				open: this.displayQuestionContent,
			};
		},
	},
	methods: {
		/** Hide/Shows question content */
		toggleQuestionContent() {
			this.displayQuestionContent = !this.displayQuestionContent;
		},

		/** Adds a numerical field input module */
		addFreeTextInputField() {
			this.questionEdit.questionModuleList.push({
				type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT,
				correctAnswer: undefined,
				marginError: "0",
				currentState: "",
				unit: "",
				_key: Date.now() + "-" + performance.now(),
			});
		},

		/** Adds a dropdown module */
		addDropdown() {
			this.questionEdit.questionModuleList.push({
				type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN,
				optionsList: [],
				currentState: undefined,
				_key: Date.now() + "-" + performance.now(),
			});
		},
		/** Start/continue question text */
		addQuestionTextField() {
			this.questionEdit.questionModuleList.push({
				type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT,
				questionText: undefined,
				_key: Date.now() + "-" + performance.now(),
			});
		},

		/** Remove question module. Catches event from children */
		removeQuestionModuleHandler(
			question:
				| QuestionInputText
				| QuestionFreeTextInput
				| QuestionDropdown
		) {
			this.questionEdit.questionModuleList.splice(
				this.questionEdit.questionModuleList.indexOf(question),
				1
			);
		},

		questionComponentType(type: QUIZ_TYPES) {
			switch (type) {
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN:
					return ModuleDropDown;
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT:
					return ModuleFreeTextInput;
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT:
					return ModuleQuestionInput;
				default:
					return null;
			}
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

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.question-module {
	display: flex;
	flex-direction: column;
}

.question-module > div > p {
	font-weight: bold;
}

.question-modules {
	padding-left: 5%;
}

.module-component {
	margin-top: 0.8rem;
	margin-bottom: 0.8rem;
	padding-top: 1rem;
	padding-bottom: 1rem;
}

.controls {
	display: flex;
	align-self: center;
	padding: 0.2rem;
}

.controls > button:nth-child(n + 2) {
	margin-left: 0.2rem;
}

.accordion {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	background-color: #eee;
	color: #444;
	padding: 0.5rem;
	flex-basis: 100%;
	transition: 0.4s;
}

.accordion.open::after {
	align-self: center;
	content: "-";
	font-size: 1.5em;
	font-weight: bold;
	color: #777;
}

.accordion:not(.open)::after {
	content: "+";
	font-size: 1.5em;
	font-weight: bold;
	color: #777;
}

.open,
.accordion:hover {
	background-color: #e8e1eb;
}

.show-hide-text {
	align-self: center;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 250ms;
}

.fade-enter,
.fade-leave-to
/* .fade-leave-active below version 2.1.8 */ {
	opacity: 0;
	transform: translateY(-5px);
}
</style>
