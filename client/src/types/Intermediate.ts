export enum NodeType {
	HINT = "HINT",
	ATTEMPT = "ATTEMPT",
	INFORMATION = "INFORMATION",
	SOLUTION = "SOLUTION",
}

export enum Action {
	SHOW_HINT = "showHint",
	ATTEMPT_ANSWER = "attemptAnswer",
	SHOW_INFORMATION = "showInformation",
	SHOW_SOLUTION = "showSolution",
}

export enum Domain {
	INTERNAL = "INTERNAL",
	EXTERNAL = "EXTERNAL",
}

export interface Node {
	type: NodeType;
	label: string;
	data: any;
	action: null | Action;
	parent: Node | null;
	children: [];
	domain: Domain;
}

export interface HintNode extends Node {
	type: NodeType.HINT;
}
export interface AttemptNode extends Node {
	type: NodeType.ATTEMPT;
}
export interface InformationNode extends Node {
	type: NodeType.INFORMATION;
}

export interface SolutionNode extends Node {
	type: NodeType.SOLUTION;
}

export const hintNode: HintNode = {
	type: NodeType.HINT,
	data: null,
	action: Action.SHOW_HINT,
	label: "Give me a hint",
	children: [],
	parent: null,
	domain: Domain.INTERNAL,
};

export const solutionNode: SolutionNode = {
	type: NodeType.SOLUTION,
	data: null,
	action: Action.SHOW_SOLUTION,
	label: "See answer",
	children: [],
	parent: null,
	domain: Domain.INTERNAL,
};

export const attemptNode: AttemptNode = {
	type: NodeType.ATTEMPT,
	data: null,
	action: Action.ATTEMPT_ANSWER,
	label: "Attempt to answer",
	children: [],
	parent: null,
	domain: Domain.INTERNAL,
};

export function generateNode(node: Node) {
	return Object.assign({}, node);
}
export const informationNode: InformationNode = {
	type: NodeType.INFORMATION,
	data: null,
	action: Action.SHOW_INFORMATION,
	label: "See relevant learning materials",
	children: [],
	parent: null,
	domain: Domain.INTERNAL,
};
