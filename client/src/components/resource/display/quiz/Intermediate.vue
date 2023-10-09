<template>
	<div class="quiz-wrapper">
		<div
			class="quiz"
			v-show="active && intermediateEnabled"
		>
			<div class="nodes">
				<button
					:disabled="getNodeDisabled(node)"
					v-html="getNodeText(node)"
					type="button"
					class="node"
					:class="getNodeClasses(node)"
					v-for="node in nodes"
					:key="node.type + node.label"
					@click="exec(node)"
				></button>
			</div>

			<ul
				class="hints"
				v-if="hints && hints.length > 0"
			>
				<li
					class="hint node-output"
					v-for="(hint, i) in hints"
					:key="question._key + hint.content"
				>
					<span class="hint-number">Hint #{{ i + 1 }}</span>
					<div v-html="hint.content"></div>
				</li>
			</ul>

			<div
				class="info node-output"
				v-if="additionalInformation"
				v-html="additionalInformation"
			></div>
		</div>
		<!-- Display answer if solution is set or prop from parent says so -->
		<div
			v-if="
				question.hint &&
				((solution && solution.trim().length > 0) || displaySolution)
			"
		>
			<h3>Solution and Explanation</h3>
			<div
				class="message hint"
				v-html="question.hint"
			></div>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import {
	QuestionModule,
	MultipleChoiceQuestion,
	QuestionAdditionalHint,
} from "@/types/Resource";
import { getIntermediateEnabled } from "@/utils/Intermediate";

import {
	Action,
	NodeType,
	Node,
	generateNode,
	attemptNode,
	hintNode,
	informationNode,
	solutionNode,
} from "@/types/Intermediate";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "UQIntermediate",
	props: {
		/** A property to store currently selected question */
		question: {
			type: Object as PropType<QuestionModule | MultipleChoiceQuestion>,
			required: true,
		},
		active: {
			type: Boolean,
			required: true,
			default: false,
		},
		/** Prop received from parent to display solution if intermediate page is not enabled */
		displaySolution: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	data() {
		return {
			selectedNode: null as Node | null,
			// nodeList: [generateNode(attemptNode)] as Node[],

			hints: [] as QuestionAdditionalHint[],
			additionalInformation: "",
			solution: "" as QuestionModule["hint"],
			attemptedNumber: 0,
		};
	},
	computed: {
		intermediateEnabled() {
			return getIntermediateEnabled();
		},
		nodes() {
			// Contain attemptNode by default
			let nodeList: Node[] = [generateNode(attemptNode)];
			// Build nodes list based on the quiz and current question
			if (!this.question) {
				return nodeList;
			}

			if (
				this.question.additionalHints &&
				Array.isArray(this.question.additionalHints) &&
				this.question.additionalHints.length > 0
			) {
				const hNode = generateNode(hintNode);
				hNode.data = this.question.additionalHints;
				nodeList.push(hNode);
			}

			if (this.question.additionalInformation) {
				nodeList.push(generateNode(informationNode));
			}

			if (this.question.hint) {
				nodeList.push(generateNode(solutionNode));
			}

			return nodeList;
		},
	},
	methods: {
		getNodeText(node: Node) {
			if (!node || !node.label) return "N/A";
			let text = node.label;
			if (!node.type) return text;
			switch (node.type) {
				case NodeType.HINT:
					text += ` ${this.getHintNodeNumber(node)}`;
					break;
				case NodeType.SOLUTION:
					text += this.isSolutionNodeLocked(node)
						? " &#128274; (try other options first)"
						: "";
					break;
				default:
					break;
			}

			return text;
		},
		getHintNodeNumber(node: Node): string {
			if (
				!node ||
				!node.type ||
				!node.data ||
				!this.question ||
				!this.question.additionalHints ||
				!this.question.additionalHints.length
			)
				return "";

			let hintsLeft = this.question.additionalHints.length;
			if (node.type === NodeType.HINT) {
				hintsLeft -= this.hints.length;
			}

			return `(${hintsLeft})`;
		},

		isSolutionNodeLocked(node: Node): boolean {
			if (node && node.type === NodeType.SOLUTION) {
				// Check if there are other nodes other than `ATTEMPT` and `SOLUTION`
				// If yes, check if they are disabled (i.e. all other options are exhausted)
				const otherNodes = this.nodes.filter(
					(n) =>
						n.type !== NodeType.ATTEMPT &&
						n.type !== NodeType.SOLUTION
				);

				// If no other nodes except ATTEMPT or SOLUTION exist, answer can be viewed if attempted at least once
				if (!otherNodes || otherNodes.length === 0) {
					return !this.attemptedNumber;
				}

				// If every otherNode is disabled , return false
				return !(
					otherNodes.every((rNode) => this.getNodeDisabled(rNode)) &&
					this.attemptedNumber > 0
				);
			}

			return false;
		},

		getNodeDisabled(node: Node): boolean {
			if (!node || !node.type) return false;

			switch (node.type) {
				case NodeType.HINT:
					return this.hints.length === node.data.length;
				case NodeType.INFORMATION:
					return !!(
						this.additionalInformation &&
						this.additionalInformation.trim().length > 0
					);
				case NodeType.SOLUTION:
					// Check if either a) solution node is locked i.e. exhausted or 2) solution is already displayed
					return (
						this.isSolutionNodeLocked(node) ||
						!!(this.solution && this.solution.trim().length > 0)
					);
				case NodeType.ATTEMPT:
					return false;
				default:
					return false;
			}
		},
		getNodeClasses(node: Node) {
			return {
				hint: node.type === NodeType.HINT,
				info: node.type === NodeType.INFORMATION,
				attempt: node.type === NodeType.ATTEMPT,
				solution: node.type === NodeType.SOLUTION,
				disabled: this.getNodeDisabled(node),
			};
		},
		resetContent() {
			this.hints = [];
			this.additionalInformation = "";
		},
		exec(node: Node) {
			if (!node.action) {
				// No action assigned to node
				return;
			}
			this.selectedNode = node;
			// this.resetContent();
			this[node.action](node);
		},

		/**
		 * Actions - Defined in `Action` enum
		 */
		[Action.SHOW_HINT](node: Node) {
			if (!this.question || !node || !node.data) {
				return;
			}

			for (let i = 0; i < node.data.length; i++) {
				const h = node.data[i];
				const index = this.hints.findIndex(
					(x: any) => x.content === h.content
				);
				if (index === -1) {
					this.hints.push(h);
					return;
				}
			}
		},

		[Action.SHOW_SOLUTION]() {
			if (!this.question) {
				return;
			}
			this.solution = this.question.hint || "";
		},

		[Action.ATTEMPT_ANSWER]() {
			this.attemptedNumber++;
			this.$emit("changeIntermediate", false);
		},

		[Action.SHOW_INFORMATION]() {
			if (!this.question) {
				return;
			}
			this.additionalInformation =
				this.question.additionalInformation || "";
		},

		additionalHints() {
			if (
				this.question &&
				this.question.additionalHints &&
				Array.isArray(this.question.additionalHints)
			) {
				return this.question.additionalHints;
			}

			// Return empty array by default
			return [];
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

.statement {
	padding: 1rem;
	border-color: 1px solid black;
}

.node {
	padding: 0.75rem 1.25rem;
	border: 1px solid transparent;
	font-size: 1.1em;
	min-width: 30%;
	margin: 0.1rem;
	text-align: center;
	cursor: pointer;
	margin-bottom: 1rem;
	border-radius: 0.25rem;
}

.nodes {
	display: flex;
	flex-flow: column;
	align-items: center;
}

.hint {
	color: #004085;
	background-color: #cce5ff;
	border-color: #b8daff;
}

.attempt {
	color: #155724;
	background-color: #d4edda;
	border-color: #c3e6cb;
}

.info {
	color: #0c5460;
	background-color: #d1ecf1;
	border-color: #bee5eb;
}

.solution {
	background-color: #d9edf7;
}

.node:hover,
.node:active,
.node:focus {
	opacity: 0.8;
}

.node.disabled {
	color: #fff !important;
	background-color: #6c757d;
	border-color: #6c757d;
	cursor: not-allowed;
	opacity: 0.65;
}

.node-output {
	margin: 0.2rem 0 0.2rem;
	padding: 1rem 1rem 1rem;
	border: 1px solid;
	border-radius: 0.2rem;
	box-shadow: transparent 0 0.2rem 0.5rem;
	-webkit-transition: background-color 0.3s;
	transition: background-color 0.3s;
}

ul {
	list-style-type: none;
	padding: 0;
}

.message {
	margin: 0.2rem 0 0.2rem;
	padding: 1rem 1rem 1rem;
	border: 1px solid;
	border-radius: 0.2rem;
	box-shadow: transparent 0 0.2rem 0.5rem;
	-webkit-transition: background-color 0.3s;
	transition: background-color 0.3s;
}

.message.hint {
	margin: 1rem 0 1rem;
	background-color: #d9edf7;
}

.hint-number {
	font-size: 1.1em;
	margin: 0.5rem 0;
	color: #45075e;
	font-weight: bold;
}
</style>
