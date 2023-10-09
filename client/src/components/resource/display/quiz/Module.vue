<template>
	<div class="question-module">
		<div
			class="message"
			v-if="checkAnswerFeedbackMessage.length > 0"
			v-bind:class="checkStyle"
		>
			{{ checkAnswerFeedbackMessage }}
		</div>
		<div
			class="question-module-component"
			v-html="question.statement"
		></div>
		<component
			:is="questionComponentType(questionModule.type)"
			:key="questionModule._key"
			:index="index"
			class="question-module-component center"
			ref="question-module-component"
			v-for="(questionModule, index) in question.questionModuleList"
			:questionModule="questionModule"
			@updated="questionModule.currentState = $event"
		></component>

		<button
			type="button"
			:class="{ disabled: intermediateEnabled && intermediateActive }"
			@click.prevent.stop="checkAnswers()"
			:disabled="intermediateEnabled && intermediateActive"
			class="button small secondary center"
		>
			Check answer
		</button>
		<Intermediate
			:displaySolution="displayHint"
			:active="intermediateActive"
			@changeIntermediate="changeIntermediateHandler"
			:question="question"
		/>
	</div>
</template>

<script lang="ts">
import ModuleDropDown from "./ModuleDropDown.vue";
import ModuleFreeTextInput from "./ModuleFreeTextInput.vue";
import ModuleInputText from "./ModuleInputText.vue";
import Intermediate from "./Intermediate.vue";
import { QUIZ_TYPES, QuestionModule } from "@/types/Resource";
import { getIntermediateEnabled } from "@/utils/Intermediate";
import { defineComponent, PropType } from "vue";

const NUMBER_OF_ATTEMPTS = 3;

export default defineComponent({
	name: "QuestionModule",
	components: {
		Intermediate,
	},
	props: {
		question: {
			type: Object as PropType<QuestionModule>,
			required: true,
		},
	},
	emits: ["updated"],
	data() {
		return {
			/** Stores the validation results from all question modules */
			answersValidArray: [] as boolean[],
			answerFeedbackMessage: "",

			// Sets if intermediate page is active
			intermediateActive: getIntermediateEnabled(),
		};
	},
	watch: {
		question() {
			this.answersValidArray = [];
		},
	},
	computed: {
		intermediateEnabled() {
			return getIntermediateEnabled();
		},
		displayHint() {
			if (
				!this.question ||
				!this.question.currentState ||
				!this.question.currentState.attemptedNumber
			)
				return false;
			return (
				this.question.currentState.attemptedNumber >=
					NUMBER_OF_ATTEMPTS ||
				this.question.currentState.correctAnswerFound
			);
		},
		checkAnswerFeedbackMessage: {
			get() {
				return this.answerFeedbackMessage;
			},
			set(newVal: string) {
				this.answerFeedbackMessage = newVal;
			},
		},

		/** Manages style for Correct/Incorrect answer message */
		checkStyle() {
			const classes: string[] = [];

			if (this.question.currentState.correctAnswerFound) {
				classes.push("correct");
			} else {
				if (this.question.currentState.attemptedNumber > 0) {
					classes.push("wrong");
				}
			}

			return classes;
		},
	},
	methods: {
		changeIntermediateHandler(enabled: boolean) {
			this.intermediateActive = enabled;
		},

		/** Returns component type based on question module type */
		questionComponentType(type: QUIZ_TYPES) {
			switch (type) {
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN:
					return ModuleDropDown;
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_FREE_TEXT_INPUT:
					return ModuleFreeTextInput;
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_INPUT_TEXT:
					return ModuleInputText;
				default:
					return null;
			}
		},

		checkAnswers() {
			const checkQuestion = { ...this.question };
			checkQuestion.currentState.attemptedNumber += 1;
			checkQuestion.currentState.correctAnswerFound = false;
			this.answersValidArray = [];

			(this.$refs["question-module-component"] as any).forEach(
				(questionModule: any) => {
					this.answersValidArray.push(questionModule.validate());
				}
			);

			if (
				this.answersValidArray.every((valid: boolean) => valid === true)
			) {
				// set true message
				checkQuestion.currentState.correctAnswerFound = true;
				this.checkAnswerFeedbackMessage = "Correct!";
				// Once correct, reset number of attempts
				checkQuestion.currentState.attemptedNumber = NUMBER_OF_ATTEMPTS;
			} else {
				const remainingAttempts =
					NUMBER_OF_ATTEMPTS -
					checkQuestion.currentState.attemptedNumber;
				this.checkAnswerFeedbackMessage = "Incorrect";
				this.changeIntermediateHandler(true);
				if (remainingAttempts > 0) {
					this.checkAnswerFeedbackMessage += `. Please try again. ${
						this.intermediateEnabled
							? ""
							: `Solution will be displayed after ${remainingAttempts}  more attempt(s).`
					}`;
				}
			}
			this.$emit("updated", checkQuestion);
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

.center {
	align-self: center;
}

.question-module-component {
	padding: 0.5rem 0 0.5rem;
}

.message {
	margin: 0.2rem 0 0.2rem;
	padding: 1rem 1rem 1rem;
	border: 1px solid;
	border-radius: 0.2rem;
	box-shadow: transparent 0 0.2rem 0.5rem;
	-webkit-transition: background-color 0.3s;
	transition: background-color 0.3s;
}

.correct {
	background-color: #dff0d8;
	color: #3c763d;
}

.correct:hover {
	background-color: #dff0d8;
}

.wrong {
	background-color: #f2dede;
	color: #a94442;
}

.wrong:hover {
	background-color: #f2dede;
}

.hint {
	margin: 1rem 0 1rem;
	background-color: #d9edf7;
}

.disabled {
	color: #fff;
	background-color: #6c757d;
	border-color: #6c757d;
	opacity: 0.65;
}
</style>
