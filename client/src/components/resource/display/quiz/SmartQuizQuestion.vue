<template>
	<div class="quiz">
		<!-- Question Component -->
		<component
			:key="item._id"
			:is="questionComponentType(selectedQuestion.content.type)"
			:question="selectedQuestion.content"
			@updated="selectedQuestion = $event"
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
	IResource_Quiz_Question,
} from "../../../../types/Resource";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "SmartQuizQuestion",
	props: {
		/** Quiz resource item */
		item: {
			type: Object as PropType<IResource_Quiz_Question>,
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
		questions(): IResource_Quiz_Question {
			/** Gets the array of questions present in the quiz resource */
			return this.item;
		},
		/** Gets and sets the current question */
		selectedQuestion: {
			get() {
				return this.questions;
			},
			set(newVal: IResource_Quiz_Question) {
				this.question = newVal;
			},
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
