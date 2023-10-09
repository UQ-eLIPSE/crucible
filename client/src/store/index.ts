import { createStore, createLogger } from "vuex";
import { clipboardModule } from "./clipboard";
import type { State } from "./state";
import { newState } from "./state";
import { userSessionsModule } from "./user_session";
import { viewportModule } from "./viewport";

const store = createStore<State>({
	state: newState(),
	modules: {
		userSessionsModule,
		clipboardModule,
		viewportModule,
	},
	strict: process.env.NODE_ENV !== "production",
	...(process.env.NODE_ENV !== "production" && { plugins: [createLogger()] }),
});

export default store;
