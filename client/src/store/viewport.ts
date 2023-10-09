import { testViewportMode, ViewportMode } from "@/utils/Viewports";
import type {
	ActionContext,
	ActionTree,
	GetterTree,
	Module,
	MutationTree,
} from "vuex";
import type { State } from "./state";
import { newState } from "./state";

// ====================================== Mutations =======================================

export const enum MutationTypes {
	AdjustViewport = "ADJUST_VIEWPORT",
}

export type Mutations<S = State> = {
	[MutationTypes.AdjustViewport](state: S, viewportMode: ViewportMode): void;
};
// Mutation function logic
export const mutations: MutationTree<State> & Mutations = {
	[MutationTypes.AdjustViewport](state, viewportMode) {
		state.viewport = viewportMode;
	},
};

// ====================================== Actions =======================================
type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload: Parameters<Mutations[K]>[1]
	): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">;

export const enum Action {
	UpdateViewportInfo = "UPDATE_VIEWPORT_INFO",
}

export interface Actions {
	[Action.UpdateViewportInfo]({
		commit,
	}: AugmentedActionContext): Promise<void>;
}
// Action function logic
export const actions: ActionTree<State, State> & Actions = {
	async [Action.UpdateViewportInfo]({ commit }) {
		if (testViewportMode(ViewportMode.Mobile)) {
			commit(MutationTypes.AdjustViewport, ViewportMode.Mobile);
		} else if (testViewportMode(ViewportMode.Tablet)) {
			commit(MutationTypes.AdjustViewport, ViewportMode.Tablet);
		} else {
			commit(MutationTypes.AdjustViewport, ViewportMode.Desktop);
		}
	},
};

// ====================================== Getters =======================================

const isViewportMobile = (state: State): boolean => {
	return state.viewport === ViewportMode.Mobile;
};

const isViewportTablet = (state: State): boolean => {
	return state.viewport === ViewportMode.Tablet;
};

const isViewportDesktop = (state: State): Boolean => {
	return state.viewport === ViewportMode.Desktop;
};

export const getters: GetterTree<State, State> = {
	isViewportMobile,
	isViewportTablet,
	isViewportDesktop,
};

// ====================================== Module export =======================================

export const viewportModule: Module<State, State> = {
	state: newState(),
	mutations,
	actions,
	getters,
};
