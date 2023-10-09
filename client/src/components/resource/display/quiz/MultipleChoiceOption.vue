<template>
	<div
		class="question-option"
		v-bind:class="optionStyle"
		@click="selectedMe()"
	>
		{{ generateAlphabet(index) }}<span v-html="option.optionValue"></span>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { QuestionOption } from "@/types/Resource";

export default defineComponent({
	name: "MultipleChoiceOption",
	props: {
		/* The option object received from parent */
		option: {
			type: Object as PropType<QuestionOption>,
			required: true,
		},
		/* The index of the option object in the question */
		index: {
			type: Number,
			required: true,
		},
		/* Stores whether the option has already been selected */
		alreadySelected: {
			type: Boolean,
			required: true,
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		optionStyle() {
			const classes: string[] = [];

			// If this option has been selected, then add the appropriate class
			// showing the correctness of the answer
			if (this.alreadySelected) {
				if (this.option.optionCorrect) {
					classes.push("correct");
				} else {
					classes.push("wrong");
				}
			}

			if (this.disabled) {
				classes.push("disabled");
			}

			return classes;
		},
	},
	methods: {
		// Emits an event to the parent component when clicked
		selectedMe() {
			// Do nothing if disabled
			if (this.disabled) return;

			this.$emit("selectedOption", this.option);
		},

		generateAlphabet(index: number) {
			return String.fromCharCode(65 + index) + ". ";
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.question-option {
	cursor: pointer;
	margin: 0.2rem 0 0.2rem;
	padding: 1rem 1rem 1rem;
	border: 1px solid;
	border-radius: 0.2rem;
	box-shadow: transparent 0 0.2rem 0.5rem;
	-webkit-transition: background-color 0.3s;
	transition: background-color 0.3s;
}

.question-option:hover:not(.disabled) {
	background-color: #e8e1eb;
}

.correct {
	background-color: #dff0d8;
	color: #3c763d;
}

.correct:hover:not(.disabled) {
	background-color: #dff0d8;
}

.wrong {
	background-color: #f2dede;
	color: #a94442;
}

.wrong:hover:not(.disabled) {
	background-color: #f2dede;
}

.disabled {
	border: 1px solid #999999;
	background-color: #cccccc;
	color: #666666;
	cursor: not-allowed;
}
</style>
