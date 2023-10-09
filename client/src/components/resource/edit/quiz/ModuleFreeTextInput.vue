<template>
	<div class="quiz-freetext">
		<div class="quiz-freetext-header">
			<p>Numerical input module</p>
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
		<div class="row">
			<div class="col">
				<p>Answer</p>
				<label>
					<span class="error">{{
						answerValid ? "" : "Must be a number"
					}}</span>
					<input
						class="freetext-input"
						type="text"
						v-model="questionModuleEdit.correctAnswer"
						placeholder="Answer ..."
					/>
				</label>
			</div>
			<div class="col">
				<p>Margin of error (absolute value)</p>
				<label>
					<span class="error">{{
						marginOfErrorValid ? "" : "Must be a number"
					}}</span>
					<input
						class="freetext-input"
						type="text"
						v-model="questionModuleEdit.marginError"
						placeholder="Error ..."
					/>
				</label>
			</div>

			<div class="col">
				<p>Unit (Optional)</p>
				<input
					class="freetext-input"
					type="text"
					v-model="questionModuleEdit.unit"
					placeholder="Enter unit e.g. kg, m, cm"
				/>
			</div>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { QuestionFreeTextInput } from "@/types/Resource";

export default defineComponent({
	name: "ModuleFreeTextInput",
	props: {
		/** Free text numerical input module */
		questionModule: {
			type: Object as PropType<QuestionFreeTextInput>,
			required: true,
		},
	},
	emits: ["update:questionModule", "removeQuestionModule"],
	computed: {
		questionModuleEdit: {
			get() {
				return this.questionModule;
			},
			set(question: QuestionFreeTextInput) {
				this.$emit("update:questionModule", question);
			},
		},
		marginOfErrorValid() {
			// Check if margin of error is a valid value
			return !(
				!this.questionModule ||
				isNaN(this.questionModule.marginError as any)
			);
		},

		answerValid() {
			return !(
				!this.questionModule ||
				isNaN(this.questionModule.correctAnswer as any)
			);
		},
	},
	methods: {
		removeQuestionModule() {
			this.$emit("removeQuestionModule", this.questionModule);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.quiz-freetext {
	display: flex;
	flex-direction: column;
	border: 1px solid #afacb7;
	background-color: #fafafa;
	border-radius: 4px;
	margin: 0.5rem 0 0.5rem;
	padding: 1rem;
}

.quiz-freetext-header {
	display: flex;
	justify-content: space-between;
}

.quiz-freetext > p {
	font-weight: bold;
}

.row {
	display: flex;
	flex-flow: row;
	flex-wrap: wrap;
}

.col {
	display: flex;
	flex-direction: column;
	padding: 0.5rem;
}

.error {
	color: lightcoral;
	font-weight: bold;
	font-size: 0.8em;
}

label {
	display: flex;
	flex-direction: column;
}
</style>
