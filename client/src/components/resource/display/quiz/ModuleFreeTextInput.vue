<template>
	<div class="question-module-freetext">
		<input
			type="text"
			v-model="answer"
		/>
		<span class="unit">
			<i>{{ unit }}</i>
		</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { QuestionFreeTextInput } from "@/types/Resource";

export default defineComponent({
	name: "ModuleFreeTextInput",
	props: {
		questionModule: {
			type: Object as PropType<QuestionFreeTextInput>,
			required: true,
		},
	},
	emits: ["updated"],
	computed: {
		answer: {
			get(): string {
				return this.questionModule.currentState === undefined
					? ""
					: this.questionModule.currentState;
			},
			set(newValue: string) {
				this.$emit("updated", newValue);
			},
		},
		unit(): string {
			return this.questionModule.unit || "";
		},
	},
	methods: {
		validate() {
			if (
				this.questionModule.correctAnswer === undefined ||
				isNaN(this.questionModule.currentState as any)
			) {
				return false;
			}
			const correctAnswer = parseFloat(this.questionModule.correctAnswer);
			const marginError = Math.abs(
				parseFloat(this.questionModule.marginError)
			);
			const currentAnswer = parseFloat(this.answer);
			return (
				currentAnswer <= correctAnswer + marginError &&
				currentAnswer >= correctAnswer - marginError
			);
		},
	},
});
</script>
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

.question-module-freetext {
	align-self: center;
}
</style>
