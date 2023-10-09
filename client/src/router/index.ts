import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("../views/WelcomeView.vue"),
		},
		{
			// Resource editor
			path: "/resource/edit/:pathMatch(.*)*",
			component: () => import("../views/ResourceEditor.vue"),

			meta: {
				loginRequired: true,
			},
		},
		{
			// Resource Tree GraphData
			path: "/resource/treeGraph",
			component: () => import("../views/GraphData.vue"),
			
			meta: {
				loginRequired: true,
			},
		},
		{
			// Resource creator
			path: "/resource/new/:pathMatch(.*)*",
			name: "createResource",
			component: () => import("../views/ResourceCreator.vue"),

			meta: {
				loginRequired: true,
			},
		},
		{
			// Resource paths
			path: "/resource/:pathMatch(.*)*",
			name: "resource",
			component: () => import("../views/ResourceManager.vue"),
		},
		{
			// User session
			path: "/session",
			component: () => import("../views/UserSession.vue"),

			meta: {
				loginRequired: true,
			},
		},
		{
			// Purely the login page
			path: "/session/login",
			component: () => import("../views/UserSessionLogin.vue"),

			meta: {
				isLoginPage: true,
			},

			beforeEnter: (_to, _from, next) => {
				// If user session is already active, redirect to user
				// session page instead
				if (store.getters.isSessionActive) {
					return next({
						path: "/session",
					});
				}

				return next();
			},
		},
	],
});
router.beforeEach((to, from, next) => {
	const toMetadata = to.meta || {};
	const fromMetadata = from.meta || {};
	// Don't go back to the login page again if we're already on the login page
	if (toMetadata.isLoginPage && fromMetadata.isLoginPage) {
		return next(false);
	}

	// If login required and no session is active, redirect to login page
	if (toMetadata.loginRequired && !store.getters.isSessionActive) {
		return next({
			path: "/session/login",
			query: {
				returnTo: from.fullPath,
			},
		});
	}

	return next();
});

export default router;
