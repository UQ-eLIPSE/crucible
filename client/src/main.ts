import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "./assets/prism/prism.css";
import "./assets/styles/global/stylesheet.css";
import "./utils/IdentitySetup.ts";

// Katex CSS
import "katex/dist/katex.min.css";
import { ActionTypes } from "./store/user_session";

(async () => {
	/**
	 * Immediately call out to /whoami to check who the user is
	 *
	 * This is done before initialising Vue because routing to certain paths
	 * may require session information (e.g. when deciding if a redirect to a
	 * login page is required)
	 *
	 */
	await store.dispatch(ActionTypes.FetchWhoAmI);

	const app = createApp(App);

	app.use(router);

	app.use(store);

	app.mount("#app");
})();
