<template>
	<div class="quiz-dropdown">
		<div class="dropdown-header">
			<p>Dropdown module</p>
			<div>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="removeQuestionModule()"
				>
					Remove
				</button>
			</div>
		</div>
		<div
			class="error"
			v-if="!optionsList || optionsList.length < 2"
		>
			Must add at least two options
		</div>
		<div class="option-controls">
			<button
				class="button small secondary"
				@click.prevent="addOption()"
			>
				+ Add Option
			</button>
		</div>

		<div class="dropdown-options">
			<div
				v-if="optionsList.length > 0"
				type="button"
				class="button small secondary accordion"
				:class="accordionStyle"
				@click.prevent="toggleOptions()"
			>
				<span class="show-hide-text">{{
					toggleOptionsButtonText
				}}</span>
			</div>
			<QuizOption
				v-show="displayOptions"
				v-for="(option, index) in optionsList"
				:key="option._key"
				:index="index"
				v-model:option="optionsList[index]"
				@removeOption="removeOptionHandler"
			>
			</QuizOption>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import QuizOption from "@/components/resource/edit/quiz/Option.vue";
import { QUIZ_TYPES, QuestionDropdown, QuestionOption } from "@/types/Resource";

export default defineComponent({
	name: "ModuleDropDown",
	components: {
		QuizOption,
	},
	props: {
		/** Dropdown question module */
		questionModule: {
			type: Object as PropType<QuestionDropdown>,
			required: true,
		},
	},
	emits: ["update:questionModule", "removeQuestionModule"],
	data() {
		return {
			/** Stores whether options are displayed / hidden */
			showOptions: true,
		};
	},
	computed: {
		questionModuleEdit: {
			get() {
				return this.questionModule;
			},
			set(question: QuestionDropdown) {
				this.$emit("update:questionModule", question);
			},
		},
		optionsList: {
			get() {
				return this.questionModule.optionsList || [];
			},
			set(options: QuestionOption[]) {
				const questionModuleList = { ...this.questionModule };
				questionModuleList.optionsList = options;
				this.$emit("update:questionModule", questionModuleList);
			},
		},

		displayOptions: {
			get() {
				return this.showOptions;
			},
			set(display: boolean) {
				this.showOptions = display;
			},
		},

		toggleOptionsButtonText() {
			return this.showOptions ? "Hide Options" : "Show Options";
		},

		accordionStyle() {
			return {
				open: this.displayOptions,
			};
		},
	},
	methods: {
		toggleOptions() {
			this.displayOptions = !this.displayOptions;
		},

		/** Add new option to dropdown */
		addOption() {
			this.optionsList.push({
				type: QUIZ_TYPES.QUIZ_QUESTION_MODULE_QUESTION_DROPDOWN_OPTION,
				optionValue: undefined,
				optionCorrect: false,
				currentState: "",
				_key: Date.now() + "-" + performance.now(),
			});
		},

		removeQuestionModule() {
			this.$emit("removeQuestionModule", this.questionModule);
		},

		removeOptionHandler(option: QuestionOption) {
			this.optionsList.splice(this.optionsList.indexOf(option), 1);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.quiz-dropdown {
	display: flex;
	flex-direction: column;
	border: 1px solid #afacb7;
	background-color: #fafafa;
	border-radius: 4px;
	padding: 1rem;
	margin: 0.5rem 0 0.5rem;
}

.quiz-dropdown > p {
	font-weight: bold;
}

.dropdown-header {
	display: flex;
	justify-content: space-between;
}

.option-controls {
	padding-top: 0.5rem;
}

.dropdown-options {
	padding-top: 1rem;
	padding-left: 5%;
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

.error {
	color: lightcoral;
	font-weight: bold;
	font-size: 0.8em;
}
</style>
