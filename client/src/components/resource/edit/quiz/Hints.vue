<template>
	<div class="quiz-dropdown">
		<div class="dropdown-header">
			<p>Hints</p>
		</div>

		<div class="option-controls">
			<button
				class="button small secondary"
				@click.prevent="addHint()"
			>
				+ Add Hint
			</button>
		</div>

		<div class="dropdown-options">
			<div
				v-if="hintsList.length > 0"
				type="button"
				class="button small secondary accordion"
				:class="accordionStyle"
				@click.prevent="toggleOptions()"
			>
				<span class="show-hide-text">{{
					toggleOptionsButtonText
				}}</span>
			</div>

			<QuizHint
				v-show="displayHints"
				v-for="(hint, index) in hintsList"
				:key="hint._key"
				:index="index"
				v-model:hint="hintsList[index]"
				@removeHint="removeHintHandler"
			>
			</QuizHint>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import QuizHint from "./Hint.vue";
import { QUIZ_TYPES, QuestionAdditionalHint } from "@/types/Resource";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "QuizHints",
	components: {
		QuizHint,
	},
	props: {
		/** Dropdown question module */
		additionalHints: {
			type: Object as PropType<QuestionAdditionalHint[]>,
			required: true,
		},
	},
	emits: ["update:additionalHints"],
	data() {
		return {
			/** Stores whether options are displayed / hidden */
			showHints: true,
		};
	},
	computed: {
		hintsList: {
			get() {
				return this.additionalHints || [];
			},
			set(hints: QuestionAdditionalHint[]) {
				this.$emit("update:additionalHints", [...hints]);
			},
		},
		displayHints: {
			get() {
				return this.showHints;
			},
			set(display: boolean) {
				this.showHints = display;
			},
		},
		toggleOptionsButtonText() {
			return this.showHints ? "Hide Hints" : "Show Hints";
		},
		accordionStyle() {
			return {
				open: this.displayHints,
			};
		},
	},
	methods: {
		toggleOptions() {
			this.displayHints = !this.displayHints;
		},

		/** Add new option to dropdown */
		addHint() {
			this.hintsList.push({
				type: QUIZ_TYPES.QUIZ_QUESTION_ADDITIONAL_HINT,
				content: "",
				_key: Date.now() + "-" + performance.now(),
			});
		},

		// removeQuestionModule() {
		//     this.$emit("removeQuestionModule", this.questionModule);
		// }

		removeHintHandler(hint: QuestionAdditionalHint) {
			this.hintsList.splice(this.hintsList.indexOf(hint), 1);
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
</style>
