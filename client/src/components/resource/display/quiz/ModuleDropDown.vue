<template>
	<div class="question-module-dropdown">
		<div
			class="fake-select"
			@click.prevent="showOptions()"
		>
			<div
				class="init"
				v-html="selectedOption.optionValue"
			></div>
			<div class="arrow-down"></div>
		</div>
		<div class="options-wrapper">
			<div
				class="options"
				v-show="displayOptions"
			>
				<div
					v-for="option in options"
					class="dropdown-option"
					:key="option._key"
					v-html="option.optionValue"
					@click.prevent="selectOption(option)"
				></div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { QuestionDropdown, QuestionOption } from "@/types/Resource";

export default defineComponent({
	name: "QuestionDropDown",
	props: {
		questionModule: {
			type: Object as PropType<QuestionDropdown>,
			required: true,
		},
	},
	emits: ["updated"],
	data() {
		return {
			/* Stores if correct option has been selected */
			correctAnswerFound: false,

			/** Stores if options are displayed / hidden */
			optionsDisplay: false,

			currentSelection: undefined as QuestionOption | undefined,
		};
	},
	created() {
		if (this.questionModule.currentState === undefined) {
			this.$emit("updated", this.options[0]);
		} else {
			this.selectedOption = this.questionModule.currentState;
		}
	},
	computed: {
		displayOptions: {
			get() {
				return this.optionsDisplay;
			},
			set(newVal: boolean) {
				this.optionsDisplay = newVal;
			},
		},
		options() {
			return this.questionModule.optionsList;
		},
		selectedOption: {
			get() {
				return this.currentSelection || this.options[0];
			},
			set(newVal: QuestionOption) {
				this.$emit("updated", newVal);
				this.currentSelection = newVal;
			},
		},
	},
	methods: {
		showOptions() {
			this.displayOptions = !this.displayOptions;
		},
		selectOption(option: QuestionOption) {
			this.selectedOption = option;
			this.displayOptions = false;
		},
		validate() {
			return this.selectedOption.optionCorrect;
		},
	},
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.question-module-dropdown {
	display: flex;
	flex-direction: column;
	align-self: center;
}

.fake-select {
	display: flex;
	flex-wrap: nowrap;
	flex-shrink: 0;
	justify-content: space-between;
	padding: 0.6rem;
	border: 1px solid #ccc;
	border-radius: 0.2rem;
	transition: border-color 0.5s;
}

.arrow-down {
	align-self: center;
	border-left: 5px solid transparent;
	border-right: 5px solid transparent;
	border-top: 10px solid black;
	width: 0;
	height: 0;
	margin-left: 0.5rem;
}

.options {
	position: absolute;
	border: 1px solid #ccc;
	border-radius: 0.2rem;
	z-index: 1;
}

.dropdown-option {
	padding: 0.6rem;
	border-bottom: 1px solid #ccc;
	transition: border-color 0.5s;
	background-color: #fff;
	cursor: pointer;
}

.dropdown-option:hover,
.fake-select:hover {
	border-color: #49075e;
}

.dropdown-option:hover {
	background-color: #e8e1eb;
}

.options-wrapper {
	position: relative;
}
</style>
