<template>
	<div
		id="application"
		:class="appClasses"
	>
		<header id="header">
			<router-link to="/">{{ applicationName }}</router-link>
			<!-- Hide navbar if viewport is mobile -->
			<div
				class="navbar"
				v-if="!isViewportMobile"
			>
				<!-- Clipboard notification badge -->
				<div
					v-if="clipboardItemExists"
					class="clipboard-badge"
					@touchenter="showTooltip()"
					@touchleave="hideTooltip()"
					@mouseover="showTooltip()"
					@mouseleave="hideTooltip()"
				>
					<div class="text">Clipboard</div>
					<span
						class="badge"
						v-show="!showClipboardInfo"
						>1</span
					>
					<div
						class="clipboard-info"
						v-show="showClipboardInfo"
					>
						<div>
							<b>{{ clipboardItemOperation }}</b>
						</div>
						<!-- <div v-if="clipboardItemInfo">{{ clipboardItemInfo }}</div> -->
					</div>
				</div>

				<RouterLink
					class="nav-item"
					to="/"
					>Home</RouterLink
				>

				<!-- Session link switches between log in and user account info -->
				<a
					v-if="!isSessionActive"
					class="nav-item"
					href="#/session/login"
					@click.prevent="goToLogIn()"
					>Admin</a
				>
				<a
					v-if="!isSessionActive"
					class="nav-item"
					:href="
						'https://api.uqcloud.net/login/' +
						configData.API_URL +
						'/api/auth/login/sso'
					"
					>Admin SSO</a
				>

				<RouterLink
					v-else
					class="nav-item"
					to="/session"
					>{{ sessionUsername }}</RouterLink
				>
			</div>
		</header>

		<RouterView id="container"></RouterView>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { Action } from "./store/viewport";
import Config from "../config.json";
import { DefaultConfig } from "./utils/IdentitySetup";

export default defineComponent({
	components: {
		RouterLink,
		RouterView,
	},
	data() {
		return {
			showClipboardInfo: false,
			lastViewportInfoUpdateTimestamp: -1,
		};
	},
	mounted() {
		// Update viewport information now
		this.updateViewportInfo(0);
		window.addEventListener("resize", () => {
			// Debounce with requestAnimationFrame
			requestAnimationFrame(this.updateViewportInfo);
		});
	},
	computed: {
		configData() {
    		return Config;
  		},
		clipboardItemExists() {
			return this.$store.getters.clipboardItemExists;
		},
		clipboardItemOperation() {
			if (this.$store.getters.clipboard.operation === "copy")
				return "Copied";
			if (this.$store.getters.clipboard.operation === "cut") return "Cut";
			return "";
		},
		applicationName() {
			if (Config && Config.BRANDING && Config.BRANDING.APP_NAME) {
				return Config.BRANDING.APP_NAME;
			}

			return DefaultConfig.BRANDING.APP_NAME;
		},
		appClasses() {
			// Note that these classes are used throughout the application for
			// determining viewport breakpoints
			return {
				"viewport-mobile": this.$store.getters
					.isViewportMobile as boolean,
				"viewport-tablet": this.$store.getters
					.isViewportTablet as boolean,
				"viewport-desktop": this.$store.getters
					.isViewportDesktop as boolean,
			};
		},
		isSessionActive() {
			return this.$store.getters.isSessionActive as boolean;
		},
		sessionUsername() {
			return this.$store.getters.sessionUsername as string | undefined;
		},
		isViewportMobile() {
			return this.$store.getters.isViewportMobile as boolean;
		},
		/**
		 * Checks if browser is compatible.
		 * Currently checks for IE (not compatible), and returns false if IE is detected.
		 */
		isBrowserCompatible() {
			const isIE =
				navigator.userAgent.indexOf("MSIE") !== -1 ||
				navigator.appVersion.indexOf("Trident/") > 0;
			return !isIE;
		},
	},
	methods: {
		goToLogIn() {
			// Check if browser is compatible
			if (!this.isBrowserCompatible) {
				alert(
					"Please log in using a supported browser, such as Google Chrome or Mozilla Firefox"
				);
				return;
			}

			// Go to login page with full path encoded in return query
			this.$router.push({
				path: "/session/login",
				query: {
					returnTo: this.$route.fullPath,
				},
			});
		},
		showTooltip() {
			this.showClipboardInfo = true;
		},
		hideTooltip() {
			this.showClipboardInfo = false;
		},
		updateViewportInfo(timestamp: number) {
			// Ignore duplicate calls at the same timestamp
			if (this.lastViewportInfoUpdateTimestamp === timestamp) {
				return;
			}

			// @TODO - This store logic will need to be re-written.
			// Tell state store to update itself with viewport information
			this.$store.dispatch(Action.UpdateViewportInfo);
		},
	},
});
</script>

<style lang="scss" scoped>
#app {
	display: flex;
	flex-direction: column;
	min-height: 100%;

	background: #f5f5f5;
}

#header {
	flex-grow: 0;
	flex-shrink: 0;

	font-size: 1.5rem;
	padding: 2rem;
	background: #49075e;
	color: #fff;

	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

#header a {
	text-decoration: none;
}

#header a:focus,
#header a:active,
#header a:hover {
	text-decoration: underline;
}

.navbar {
	font-size: 0.7em;

	display: inline-flex;
	flex-direction: row;
	align-items: center;
}

.nav-item {
	margin-left: 2rem;
}

#container {
	flex-grow: 1;
}

.clipboard-badge {
	position: relative;
	border-radius: 4%;
	background-color: rgba(255, 255, 255, 0.5);
	box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.clipboard-badge > .text {
	outline: 0.2rem solid rgba(0, 0, 0, 0.1);
	padding: 0.5rem;
}

.badge {
	position: absolute;
	top: -0.5rem;
	right: -0.35rem;
	color: white;
	background: rgb(189, 161, 78);
	border: 1px solid transparent;
	border-radius: 25%;
	font-size: 0.7em;
	padding: 0.1rem 0.2rem 0.1rem;
}

.clipboard-info {
	position: absolute;
	width: 9rem;
	top: 2rem;
	color: #efefef;
	padding: 1rem;
	font-size: 1em;
	background: #2b222a;
	border-radius: 2px;
	right: -40%;
}

.clipboard-info::before {
	content: "";
	position: absolute;
	left: 50%;
	width: 0;
	height: 0;
	border: 20px solid transparent;
	border-bottom: 1rem solid #2b222a;
	border-top: 0;
	margin-left: -20px;
	margin-top: -20px;
}

/* Mobile Styles */

.viewport-mobile #header {
	padding: 0.7rem 1rem 0.7rem;
	font-size: 1.3rem;
}

/* Tablet Styles */

.viewport-tablet #header {
	padding: 0.7rem 1rem 0.7rem;
}
</style>
