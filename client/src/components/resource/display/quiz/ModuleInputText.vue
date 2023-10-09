<template>
	<div class="question-module-questiontext">
		<div
			class="question-text"
			v-html="questionModule.questionText"
		></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { QuestionInputText } from "@/types/Resource";

export default defineComponent({
	name: "QuestionInputText",
	props: {
		questionModule: {
			type: Object as PropType<QuestionInputText>,
			required: true,
		},
	},
	methods: {
		/** Always returns true since nothing needs to be evaluated for this component */
		validate() {
			return true;
		},
	},
});
</script>

<style lang="scss" scoped>
.question-module-questiontext {
	align-self: center;
}

.question-text {
	text-align: center;
}
</style>
