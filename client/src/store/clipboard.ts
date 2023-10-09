import type { GetterTree, Module, MutationTree } from "vuex";
import { newState } from "./state";
import type { State, Clipboard } from "./state";
import type { IResource_FromServer } from "../types/Resource";

// ====================================== Mutations =======================================
export const enum MutationTypes {
	CopyItem = "COPY_ITEM",
	CopyAllItems = "COPY_ALL_ITEMS",
	CutItem = "CUT_ITEM",
	CutAllItems = "CUT_ALL_ITEMS",
	ClearClipboard = "CLEAR_CLIPBOARD",
}

// Mutation function input parameters and return types
export type Mutations<S = State> = {
	[MutationTypes.CopyItem](state: S, item: IResource_FromServer): void;
	[MutationTypes.CopyAllItems](state: S, items: IResource_FromServer[]): void;
	[MutationTypes.CutItem](state: S, item: IResource_FromServer): void;
	[MutationTypes.CutAllItems](state: S, items: IResource_FromServer[]): void;
	[MutationTypes.ClearClipboard](state: S): void;
};
// Mutation function logic
export const mutations: MutationTree<State> & Mutations = {
	[MutationTypes.CopyItem](state, item) {
		state.clipboard.item = { ...item };
		state.clipboard.operation = "copy";
	},

	[MutationTypes.CopyAllItems](state, items) {
		state.clipboard.multipleItems = items.map((item) => {
			return { ...item };
		});
		state.clipboard.operation = "copy";
	},

	[MutationTypes.CutItem](state, item) {
		state.clipboard.item = { ...item };
		state.clipboard.operation = "cut";
	},

	[MutationTypes.CutAllItems](state, items) {
		state.clipboard.multipleItems = items.map((item: any) => {
			return { ...item };
		});
		state.clipboard.operation = "cut";
	},

	[MutationTypes.ClearClipboard](state) {
		state.clipboard.item = undefined;
		state.clipboard.multipleItems = undefined;
		state.clipboard.operation = "unset";
	},
};

// ====================================== Getters =======================================
const clipboardItemExists = (state: State): boolean => {
	return Boolean(
		state.clipboard.item ||
			(state.clipboard.multipleItems &&
				(state.clipboard.operation === "copy" ||
					state.clipboard.operation === "cut"))
	);
};

const clipboard = (state: State): Clipboard | undefined => {
	return clipboardItemExists(state) && state?.clipboard
		? state.clipboard
		: undefined;
};

const getters: GetterTree<State, State> = {
	clipboardItemExists,
	clipboard,
};

// ====================================== Module export =======================================

export const clipboardModule: Module<State, State> = {
	state: newState(),
	getters,
	mutations,
};
