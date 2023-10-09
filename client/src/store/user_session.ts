import type {
	ActionContext,
	ActionTree,
	GetterTree,
	Module,
	MutationTree,
} from "vuex";
import type { Session, State } from "./state";
import { newState } from "./state";
import Api from "../api";

// ====================================== Mutations =======================================

export const enum MutationTypes {
	WriteSession = "WRITE_SESSION",
	DeleteSession = "DELETE_SESSION",
}
// Mutation function input parameters and return types
export type Mutations<S = State> = {
	[MutationTypes.WriteSession](state: S, sessionData: Session): void;
	[MutationTypes.DeleteSession](state: S): void;
};

// Mutation function logic
export const mutations: MutationTree<State> & Mutations = {
	[MutationTypes.WriteSession](state, sessionData) {
		state.session = sessionData;
	},
	[MutationTypes.DeleteSession](state) {
		state.session = undefined;
	},
};

// ====================================== Actions =======================================

type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload?: Parameters<Mutations[K]>[1]
	): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">;

export const enum ActionTypes {
	LogInLocal = "LOG_IN_LOCAL",
	LogOut = "LOG_OUT",
	FetchWhoAmI = "FETCH_WHOAMI",
}

// Action function input parameter and return interfaces
export interface Actions {
	[ActionTypes.LogInLocal](
		{ commit }: AugmentedActionContext,
		data: { username: string; password: string }
	): Promise<void>;
	[ActionTypes.LogOut]({ commit }: AugmentedActionContext): Promise<void>;
	[ActionTypes.FetchWhoAmI]({
		commit,
	}: AugmentedActionContext): Promise<void>;
}

// Action function logic
export const actions: ActionTree<State, State> & Actions = {
	// Log in user
	async [ActionTypes.LogInLocal]({ commit }, data) {
		// POST log in
		const result = await Api.Auth.postLocalLogin(data);

		const { _id, username } = result.data;

		// When log in okay, set state
		const session: Session = {
			_id,
			username,
		};
		commit(MutationTypes.WriteSession, session);
	},
	// Log out user
	async [ActionTypes.LogOut]({ commit }) {
		// POST log out
		await Api.Auth.postLogout();

		// Then delete session info on client
		commit(MutationTypes.DeleteSession);
	},
	// Check who current user is
	async [ActionTypes.FetchWhoAmI]({ commit }) {
		try {
			const result = await Api.Auth.getWhoAmI();

			const { _id, username } = result.data;

			const session: Session = {
				_id,
				username,
			};

			commit(MutationTypes.WriteSession, session);
		} catch {
			// Don't throw - silently fail instead
		}
	},
};

// ====================================== Getters =======================================

const isSessionActive = (state: State) => {
	return state.session !== undefined;
};

const sessionUsername = (state: State) => {
	if (!isSessionActive(state)) {
		return undefined;
	}
	return state.session!.username;
};

const sessionUserId = (state: State) => {
	if (!isSessionActive(state)) {
		return undefined;
	}
	return state.session!._id;
};

export const getters: GetterTree<State, State> = {
	isSessionActive,
	sessionUsername,
	sessionUserId,
};

// ====================================== Module export =======================================

export const userSessionsModule: Module<State, State> = {
	state: newState(),
	getters,
	actions,
	mutations,
};
