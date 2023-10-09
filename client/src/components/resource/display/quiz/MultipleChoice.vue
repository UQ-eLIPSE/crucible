<template>
	<div class="mutiple-choice-question">
		<div
			class="message"
			v-if="checkAnswerFeedbackMessage.length > 0"
			v-bind:class="checkStyle"
		>
			{{ checkAnswerFeedbackMessage }}
		</div>
		<!-- Question problem statement -->
		<div class="statement">
			<p v-html="question.statement"></p>
		</div>

		<!-- Question options -->
		<ul ref="options">
			<li
				class="question-option"
				v-for="(option, index) in question.optionsList"
				:key="option._key"
			>
				<!-- Component for quiz option -->
				<MultipleChoiceOption
					:alreadySelected="isSelectedAlready(option)"
					:index="index"
					:disabled="intermediateActive"
					:option="option"
					v-on:selectedOption="selectionHandler"
				>
				</MultipleChoiceOption>
			</li>
		</ul>

		<Intermediate
			:displaySolution="question.currentState.correctAnswerFound"
			:active="intermediateActive"
			@changeIntermediate="changeIntermediateHandler"
			:question="question"
		/>
	</div>
</template>

<script lang="ts">
import MultipleChoiceOption from "./MultipleChoiceOption.vue";
import Intermediate from "./Intermediate.vue";
import type { MultipleChoiceQuestion, QuestionOption } from "@/types/Resource";
import { getIntermediateEnabled } from "@/utils/Intermediate";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "MultipleChoice",
	components: {
		MultipleChoiceOption,
		Intermediate,
	},
	props: {
		/** Currently selected question */
		question: {
			type: Object as PropType<MultipleChoiceQuestion>,
			required: true,
		},
	},
	emits: ["updated"],
	data() {
		return {
			answerFeedbackMessage: "",
			intermediateActive: getIntermediateEnabled() as boolean,
		};
	},
	watch: {
		question() {
			this.checkAnswerFeedbackMessage = "";
		},
	},
	computed: {
		checkAnswerFeedbackMessage: {
			get() {
				return this.answerFeedbackMessage;
			},
			set(newValue: string) {
				this.answerFeedbackMessage = newValue;
			},
		},
		/** Manages style for Correct/Incorrect answer message */
		checkStyle() {
			const classes: string[] = [];
			if (this.question.currentState.correctAnswerFound) {
				classes.push("correct");
			} else {
				classes.push("wrong");
			}

			return classes;
		},
	},
	methods: {
		changeIntermediateHandler(enabled: boolean) {
			this.intermediateActive = enabled;
		},
		/** Returns whether the given option has already been selected prior */
		isSelectedAlready(option: QuestionOption) {
			return (
				this.question.currentState.alreadySelectedOptions.indexOf(
					option
				) !== -1
			);
		},

		/** Event handler which captures "selectOption" */
		// Event received from MultipleChoiceOption component
		selectionHandler(selectedOption: QuestionOption) {
			const selectedQuestion = { ...this.question };
			if (selectedOption.optionCorrect) {
				selectedQuestion.currentState.correctAnswerFound = true;
				this.checkAnswerFeedbackMessage = "Correct!";
			} else {
				this.checkAnswerFeedbackMessage =
					"Incorrect. Please try again.";
				selectedQuestion.currentState.correctAnswerFound = false;
				this.changeIntermediateHandler(true);
			}
			if (!this.isSelectedAlready(selectedOption)) {
				selectedQuestion.currentState.alreadySelectedOptions.push(
					selectedOption
				);
			}
			this.$emit("updated", selectedQuestion);
		},
	},
});
</script>

<style lang="scss" scoped>
.statement {
	padding: 1rem;
	border-color: 1px solid black;
}

ul {
	list-style-type: none;
	padding: 1rem;
	margin: 0;
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
	background-color: #d9edf7;
	padding: 1rem;
	margin: 1rem;
}
</style>
