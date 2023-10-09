<template>
	<div class="quiz-multiple-choice">
		<div
			class="error"
			v-if="
				!questionEdit.optionsList || questionEdit.optionsList.length < 2
			"
		>
			Must add at least two options
		</div>
		<div
			class="button accordion"
			:class="accordionStyle"
			@click.prevent="toggleQuestionContent()"
		>
			<span class="show-hide-text">{{
				toggleQuestionContentButtonText
			}}</span>
		</div>
		<transition name="fade">
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
						class="button secondary small"
						@click.prevent="addOption()"
					>
						+ Add Multiple Choice Option
					</button>
				</div>
				<div class="dropdown-options">
					<div
						class="button accordion"
						:class="accordionStyleOptions"
						v-show="questionEdit.optionsList.length > 0"
						@click.prevent="toggleOptions()"
					>
						<span class="show-hide-text">{{
							toggleOptionsButtonText
						}}</span>
					</div>
					<QuizOption
						v-for="(option, index) in question.optionsList"
						v-show="displayOptions"
						:key="option._key"
						:index="index"
						v-model:option="questionEdit.optionsList[index]"
						@removeOption="removeOptionHandler"
					>
					</QuizOption>
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
		</transition>
	</div>
</template>

<script lang="ts">
import QuizOption from "./Option.vue";
import QuizHints from "./Hints.vue";
import Tinymce from "@/components/Tinymce.vue";
import { tinyMCEOptions } from "@/utils/TinyMce";
import {
	QUIZ_TYPES,
	MultipleChoiceQuestion,
	QuestionOption,
} from "@/types/Resource";
import { getUniqueId } from "@/utils/UniqueId";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "MultipleChoice",
	components: {
		QuizOption,
		Tinymce,
		QuizHints,
	},
	props: {
		question: {
			type: Object as PropType<MultipleChoiceQuestion>,
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
			showOptions: true,
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
			set(question: MultipleChoiceQuestion) {
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

		displayOptions: {
			get() {
				return this.showOptions;
			},
			set(option: boolean) {
				this.showOptions = option;
			},
		},

		toggleOptionsButtonText() {
			return this.displayOptions ? "Hide options" : "Show options";
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

		accordionStyle() {
			return {
				open: this.displayQuestionContent,
			};
		},

		accordionStyleOptions() {
			return {
				open: this.displayOptions,
			};
		},
	},
	methods: {
		toggleQuestionContent() {
			this.displayQuestionContent = !this.displayQuestionContent;
		},

		toggleOptions() {
			this.displayOptions = !this.displayOptions;
		},

		/** Add new multiple choice option */
		addOption() {
			this.questionEdit.optionsList.push({
				type: QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION_OPTION,
				optionValue: undefined,
				optionCorrect: false,
				currentState: "",
				_key: Date.now() + "-" + performance.now(),
			});
		},

		removeOptionHandler(option: QuestionOption) {
			this.questionEdit.optionsList.splice(
				this.questionEdit.optionsList.indexOf(option),
				1
			);
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

.quiz-multiple-choice {
	display: flex;
	flex-direction: column;
}

.controls {
	display: flex;
	align-self: center;
	padding: 0.2rem;
}

.controls > button:nth-child(n + 2) {
	margin-left: 0.2rem;
}

.quiz-multiple-choice > div > p {
	font-weight: bold;
}

.dropdown-options {
	padding-top: 1rem;
	margin-left: 5%;
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
.fade-leave-to {
	opacity: 0;
	transform: translateY(-5px);
}

.error {
	color: lightcoral;
	font-weight: bold;
	font-size: 0.8em;
	margin: 0.2rem 0;
}
</style>
