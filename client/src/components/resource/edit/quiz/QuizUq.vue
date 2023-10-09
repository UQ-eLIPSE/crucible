<template>
	<div>
		<div>
			<h2>{{ title }}</h2>

			<button
				type="button"
				class="button"
				@click.prevent="addMultipleChoiceQuestion()"
			>
				+ Add multiple choice question
			</button>
			<button
				type="button"
				class="button"
				@click.prevent="addQuestionModule()"
			>
				+ Add modular question
			</button>
		</div>

		<template
			v-for="(question, index) in resource.content.questionList"
			:key="`wrapper-${question._key}`"
		>
			<div class="question">
				<div class="question-header">
					<div class="question-header-text">
						<h2
							:key="`order-${question._key}`"
							class="question-order-text"
						>
							#{{ index + 1 }}
						</h2>
						<h5
							:key="`stmt-${question._key}`"
							:title="questionStatement(question.content, false)"
						>
							{{ questionStatement(question.content, true) }}
						</h5>
					</div>
					<div>
						<button
							type="button"
							class="button secondary small"
							@click.prevent="moveQuestionUp(index)"
							v-if="index > 0"
						>
							Move Up &#8679;
						</button>
						<button
							type="button"
							class="button secondary small"
							@click.prevent="moveQuestionDown(index)"
							v-if="
								index < resource.content.questionList.length - 1
							"
						>
							Move Down &#8681;
						</button>
						<button
							type="button"
							class="button secondary small delete-question-button"
							@click.prevent="removeQuestion(index)"
						>
							Delete Question
						</button>
					</div>
				</div>
				<component
					:is="questionComponentType(question.content.type)"
					:key="question._key"
					ref="childQuestions"
					v-model:question="
						resourceEdit.content.questionList[index].content
					"
					@removeQuestion="removeQuestion(index)"
				></component>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import Module from "./Module.vue";
import MultipleChoice from "./MultipleChoice.vue";
import {
	QUIZ_TYPES,
	IResource_Quiz_UQ_Chem,
	QuestionModule,
	MultipleChoiceQuestion,
	IResource_FromServer,
	Type,
	AuthMechanism,
	IResource_Quiz_Question,
} from "@/types/Resource";
import Api from "@/api";
import { defineComponent, PropType } from "vue";

function extractContent(html: string) {
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent || div.innerText;
}

export default defineComponent({
	name: "QuizUQ",
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<IResource_Quiz_UQ_Chem>,
			required: true,
		},
		/** Indicates if this component is in "edit mode" or not */
		isEdit: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["update:prop"],
	computed: {
		resourceEdit: {
			get() {
				return this.resource;
			},
			set(resource: IResource_Quiz_UQ_Chem) {
				// Update quiz or questions
				this.$emit("update:prop", resource);
			},
		},
		title() {
			return this.isEdit ? "Edit quiz" : "Create new quiz";
		},
	},
	methods: {
		/** Add new multiple choice question */
		addMultipleChoiceQuestion() {
			const multipleChoice: IResource_Quiz_Question = {
				_id: "",
				type: Type.QUIZ_QUESTION,
				label: `Question ${
					this.resourceEdit.content.questionList.length + 1
				}`,
				tags: this.resourceEdit.tags,
				permissions: {
					auth: {
						uqsso: {
							basic:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.uqsso
								]?.basic || false,
							staffOnly:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.uqsso
								]?.staffOnly || false,
						},
						internal: {
							hidden:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.internal
								]?.hidden || false,
						},
					},
				},
				content: {
					type: QUIZ_TYPES.QUIZ_MULTIPLE_CHOICE_QUESTION,
					statement: undefined,
					optionsList: [],
					hint: undefined,
					currentState: {
						alreadySelectedOptions: [],
						correctAnswerFound: false,
					},
					_key: Date.now() + "-" + performance.now(),
					additionalHints: [],
					additionalInformation: "",
				},
				thumbnail: {},
			};
			this.resourceEdit.content.questionList.push(multipleChoice);
		},

		reorderQuestion(indexFrom: number, indexTo: number) {
			if (
				!this.resource ||
				!this.resource.content ||
				!this.resource.content.questionList ||
				!this.resource.content.questionList[indexFrom] ||
				!this.resource.content.questionList[indexTo]
			) {
				return;
			}

			// Get collapsed state before keys are changed
			// const copiedQuestion = Object.assign({}, this.resource.content.questionList[indexFrom]);
			this.resourceEdit.content.questionList[indexFrom] = [
				this.resource.content.questionList[indexTo],
				(this.resourceEdit.content.questionList[indexTo] =
					this.resource.content.questionList[indexFrom]),
			][0];
			// Vue.set(this.resource.content.questionList, indexTo, copiedQuestion);

			// Force update _key's to re-render RT editors properly
			Api.Resource.appendKeysToQuiz(
				this.resource as IResource_Quiz_UQ_Chem & IResource_FromServer
			);
			this.reorderedHandler();
		},
		moveQuestionUp(index: number) {
			this.reorderQuestion(index, index - 1);
		},
		moveQuestionDown(index: number) {
			this.reorderQuestion(index, index + 1);
		},

		/** Add new modular question */
		addQuestionModule() {
			this.resourceEdit.content.questionList.push({
				_id: "",
				type: Type.QUIZ_QUESTION,
				label: `Question ${this.resourceEdit.content.questionList.length}`,
				tags: this.resourceEdit.tags,
				permissions: {
					auth: {
						uqsso: {
							basic:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.uqsso
								]?.basic || false,
							staffOnly:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.uqsso
								]?.staffOnly || false,
						},
						internal: {
							hidden:
								this.resourceEdit.permissions.auth?.[
									AuthMechanism.internal
								]?.hidden || false,
						},
					},
				},
				content: {
					type: QUIZ_TYPES.QUIZ_QUESTION_MODULE,
					statement: undefined,
					questionModuleList: [],
					hint: undefined,
					currentState: {
						attemptedNumber: 0,
						correctAnswerFound: false,
					},
					_key: Date.now() + "-" + performance.now(),
					additionalHints: [],
					additionalInformation: "",
				},
				thumbnail: {},
			});
		},
		questionStatement(
			question: QuestionModule | MultipleChoiceQuestion,
			truncated: boolean
		) {
			const MAX_CHARS = truncated ? 30 : Number.MAX_SAFE_INTEGER;
			const textContent = extractContent(question.statement || "");
			if (!textContent) {
				return "-";
			}

			return `${textContent.slice(0, MAX_CHARS)}${
				textContent.length > MAX_CHARS ? "..." : ""
			}`;
		},

		reorderedHandler() {
			this.$nextTick(() => {
				// Collapse all questions on reorder to be consistent
				const childQuestions = this.$refs["childQuestions"] as any;
				// This is not ideal but given the current constraints with the
				// tinymce editor, this is manageable
				childQuestions.forEach((q: any) => {
					q["displayQuestionContent"] = false;
				});
			});
		},

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

		removeQuestion(index: number) {
			this.resourceEdit.content.questionList.splice(index, 1);
		},
	},
});
</script>

<style lang="scss" scoped>
.question {
	border: 1px solid #49075e;
	padding: 1rem;
	margin: 1rem 0 1rem;
	border-radius: 0.2rem;
	background-color: #fff;
	box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.question-header {
	display: flex;
	justify-content: space-between;
}

.delete-question-button:hover,
.delete-question-button:active {
	background-color: #d9534f;
	border-color: #d9534f;
	color: #fff;
}

.question-order-text {
	font-weight: bold;
	color: #49075e;
}

.question-header-text {
	display: flex;
	align-items: baseline;
}

.question-header-text > * {
	padding-right: 0.1rem;
}
</style>
