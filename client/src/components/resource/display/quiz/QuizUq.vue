<template>
	<div class="quiz">
		<!-- Quiz head controls -->
		<div class="quiz-head-control">
			<button
				class="button navigate-button"
				:disabled="isFirstQuestion"
				@click.prevent="previousQuestion()"
			>
				&lt; Previous
			</button>
			<select v-model="selectedQuestion">
				<option
					v-for="(question, index) in questions"
					:value="question"
					:key="index"
				>
					Question {{ index + 1 }}
				</option>
			</select>
			<button
				class="button navigate-button"
				:disabled="isLastQuestion"
				@click.prevent="nextQuestion()"
			>
				Next &gt;
			</button>
		</div>

		<!-- Question Component -->

		<component
			:key="item._id"
			:is="questionComponentType(selectedQuestion.content.type)"
			:question="selectedQuestion.content"
			@updated="selectedQuestion.content = $event"
		>
		</component>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import MultipleChoice from "./MultipleChoice.vue";
import Module from "./Module.vue";

import {
	QUIZ_TYPES,
	IResource_Quiz_UQ_Chem,
	IResource_Quiz_Question,
} from "../../../../types/Resource";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "QuizUQ",
	props: {
		/** Quiz resource item */
		item: {
			type: Object as PropType<IResource_Quiz_UQ_Chem>,
			required: true,
		},
	},
	data() {
		return {
			/** A property to store currently selected question */
			question: undefined as IResource_Quiz_Question | undefined,
		};
	},
	computed: {
		questions(): IResource_Quiz_Question[] {
			/** Gets the array of questions present in the quiz resource */
			return this.item.content.questionList;
		},
		/** Gets and sets the current question */
		selectedQuestion: {
			get() {
				return this.question || this.questions[0];
			},
			set(newVal: IResource_Quiz_Question) {
				this.question = newVal;
			},
		},
		isLastQuestion() {
			if (
				this.selectedQuestion ===
				this.questions[this.questions.length - 1]
			) {
				return true;
			} else {
				return false;
			}
		},

		isFirstQuestion() {
			if (this.selectedQuestion === this.questions[0]) {
				return true;
			} else {
				return false;
			}
		},
	},
	watch: {
		item() {
			/** Reset question if the quiz resource i.e. item itself is changed */
			this.question = this.questions[0];
		},
	},
	methods: {
		/** Returns edit component based on question type */
		questionComponentType(questionType: QUIZ_TYPES) {
			switch (questionType) {
				case QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION:
					return MultipleChoice;
				case QUIZ_TYPES.QUIZ_QUESTION_MODULE:
					return Module;
				default:
					return null;
			}
		},

		/** Sets active selected question to the previous one in the list */
		previousQuestion() {
			const currentIndex = this.questions.indexOf(this.selectedQuestion);

			if (currentIndex > 0) {
				this.selectedQuestion = this.questions[currentIndex - 1];
			}
		},

		/** Sets active selected question to the next one in the list */
		nextQuestion() {
			const currentIndex = this.questions.indexOf(this.selectedQuestion);

			if (currentIndex < this.questions.length - 1) {
				this.selectedQuestion = this.questions[currentIndex + 1];
			}
		},
	},
});
</script>

<!-- ####################################################################### -->
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.quiz {
	display: flex;
	flex-direction: column;
	padding: 1rem;
	background-color: white;
	overflow: auto;
}

.quiz-head-control {
	display: flex;
	flex-direction: row;
	flex-shrink: 0;
	width: 100%;
	align-self: center;
	justify-content: space-between;
}

select {
	padding: 0.5rem;
	margin: 0 0.5rem;
	min-width: 1px;
	flex-grow: 1;
	flex-shrink: 1;
	overflow: hidden;
	text-overflow: ellipsis;
}

.navigate-button {
	padding: 0.5rem 0.2rem;
	flex-basis: 8rem;
}
</style>
