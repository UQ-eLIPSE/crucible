<template>
	<div class="resource-display-authorisation-request">
		<p>You are not authorized to access this resource</p>

		<p v-if="uqssoLocked">
			<button
				class="button"
				@click="launchUqSso"
			>
				Log in through<br />UQ Single Sign-On
			</button>
		</p>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "AuthorisationRequest",
	props: {
		item: {
			type: Object as PropType<IResource_FromServer>,
			required: true,
		},
	},
	computed: {
		permissionsObject() {
			return this.item.permissions || {};
		},

		uqssoLocked() {
			return (
				this.authObject &&
				this.authObject["uqsso"] &&
				this.authObject["uqsso"].basic
			);
		},

		authObject() {
			return this.permissionsObject.auth;
		},

		authProviders() {
			return this.permissionsObject.auth
				? Object.keys(this.permissionsObject.auth)
				: [];
		},
	},
	methods: {
		launchUqSso() {
			let windowHandle: Window | null = null;

			const windowOpenTime = Date.now();

			const receiveUqSsoMessage = (e: MessageEvent) => {
				const data = e.data;

				// Ignore messages not from the intended window
				if (e.source !== windowHandle) {
					return;
				}

				// Close popup login window if successful, and reload data
				if (typeof data === "string" && data === "AUTH_UQSSO_SUCCESS") {
					// We make the window appear a little longer when SSO is done
					// quickly so people don't just get a popup flashing
					// rapidly, which might be concerning

					let closeWaitTime = 0;

					if (Date.now() - windowOpenTime < 500) {
						closeWaitTime = 250;
					}

					setTimeout(() => {
						if (windowHandle) {
							windowHandle.close();
						}

						// Inform parent to reload the data (to permit access to
						// resource)
						this.$emit("reloadData");
					}, closeWaitTime);

					// Remove message listener
					window.removeEventListener("message", receiveUqSsoMessage);
				}
			};

			window.addEventListener("message", receiveUqSsoMessage);

			// Create a new popup window for logging in
			const windowWidth = 400;
			const windowHeight = 600;

			// Calculations to center the popup window
			// The below is based on https://stackoverflow.com/a/16861050
			const screenLeft: number =
				window.screenLeft !== undefined
					? window.screenLeft
					: (screen as any).left;
			const screenTop: number =
				window.screenTop !== undefined
					? window.screenTop
					: (screen as any).top;

			const width =
				window.innerWidth ||
				document.documentElement.clientWidth ||
				screen.width;
			const height =
				window.innerHeight ||
				document.documentElement.clientHeight ||
				screen.height;

			const left = width / 2 - windowWidth / 2 + screenLeft;
			const top = height / 2 - windowHeight / 2 + screenTop;

			windowHandle = window.open(
				"/_uqsso/login",
				"UQSSO_LOGIN_WINDOW",
				[
					"menubar=no",
					"toolbar=no",
					"location=no",
					"personalbar=no",
					"status=no",
					"scrollbars=yes",
					"width=" + windowWidth,
					"height=" + windowHeight,
					"top=" + top,
					"left=" + left,
				].join(",")
			);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-display-authorisation-request {
	padding: 2rem;
	text-align: center;
}
</style>
