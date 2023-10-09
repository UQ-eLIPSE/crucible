<template>
	<div class="user-session">
		<button
			class="button logout-button"
			@click.prevent="logOut()"
		>
			Log out
		</button>
		<h1 class="username-heading">{{ username }}</h1>
		<hr />
		<h3>Change password</h3>
		<div class="change-password-form">
			<label>
				<div>Current password</div>
				<div>
					<input
						type="password"
						v-model="changePassword.old"
					/>
				</div>
			</label>
			<label>
				<div>New password</div>
				<div>
					<input
						type="password"
						v-model="changePassword.new1"
					/>
				</div>
			</label>
			<label>
				<div>Repeat new password</div>
				<div>
					<input
						type="password"
						v-model="changePassword.new2"
					/>
				</div>
			</label>
			<div>
				<div>
					<button
						class="button small"
						@click.prevent="onChangePasswordButtonClick()"
					>
						Change password
					</button>
				</div>
			</div>
			<div
				v-if="changePasswordMessage"
				class="inline-message-box"
				:class="changePasswordMessageClasses"
			>
				{{ changePasswordMessageOutput }}
			</div>
		</div>
		<label><h3>Admin Controls</h3></label>
		<button
			class="button small"
			@click="downloadCsv"
		>
			Download Resource CSV
		</button>
		&nbsp;&nbsp;
		<router-link
			class="button small"
			:to="{ path: '/resource/treeGraph' }"
		>
			To Resource Tree Graph
		</router-link>
		<br />
		<span
			v-if="isLoading"
			class="flex justify-center items-center min-h-screen"
		>
			* generating CSV...
		</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from "vue";
import Api from "../api";
import { SuccessMessage } from "../types/SuccessMessage";
import { ActionTypes } from "../store/user_session";

export default defineComponent({
	data: function () {
		return {
			isLoading: false,
			changePassword: {
				old: "",
				new1: "",
				new2: "",
			},
			changePasswordMessage: undefined as SuccessMessage | undefined,
		};
	},
	watch: {
		changePassword: {
			handler() {
				// Remove any message once someone attempts a change in the fields
				this.clearChangePasswordMessage();
			},
			deep: true,
		},
	},
	computed: {
		username() {
			return this.$store.getters.sessionUsername as string | undefined;
		},
		changePasswordMessageClasses() {
			const classes: string[] = [];

			if (this.changePasswordMessage !== undefined) {
				classes.push(
					this.changePasswordMessage.success ? "positive" : "negative"
				);
			}

			return classes;
		},
		changePasswordMessageOutput() {
			return (
				this.changePasswordMessage &&
				this.changePasswordMessage.messages &&
				this.changePasswordMessage.messages.join("; ")
			);
		},
	},
	methods: {
		logOut: async function () {
			await this.$store.dispatch(ActionTypes.LogOut);

			// Once logged out, go to root
			this.$router.replace("/");
		},
		clearChangePasswordFields() {
			this.changePassword.old = "";
			this.changePassword.new1 = "";
			this.changePassword.new2 = "";
		},
		clearChangePasswordMessage() {
			this.changePasswordMessage = undefined;
		},
		setChangePasswordMessage(success: boolean, messages: string[]) {
			return (this.changePasswordMessage = {
				success,
				messages,
			});
		},
		onChangePasswordButtonClick: async function () {
			// Check that new passwords are same
			if (this.changePassword.new1 !== this.changePassword.new2) {
				this.setChangePasswordMessage(false, [
					"New passwords do not match",
				]);
				return;
			}

			// Get the new and old password
			const { old: oldPassword, new1: newPassword } = this.changePassword;

			try {
				// Send request to server to change password
				await Api.User.changePasswordForId(
					this.$store.getters.sessionUserId,
					{
						old: oldPassword,
						new: newPassword,
					}
				);

				// Reset fields, set success message
				this.clearChangePasswordFields();
				nextTick(() =>
					this.setChangePasswordMessage(true, [
						"Password changed successfully",
					])
				);
			} catch (e: any) {
				let message = "Password change not successful";

				// Check to see if the error has a response from the server;
				// append message from server if available
				if (e.response && e.response.data && e.response.data.error) {
					message += ` (${e.response.data.error})`;
				}

				this.setChangePasswordMessage(false, [message]);
			}
		},
		// Fucntion to call API and download CSV
		async downloadCsv() {
			this.isLoading = true;
			try {
				const response = await Api.Resource.getCSV();
				if (response.status < 200 || response.status >= 300) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				const url = window.URL.createObjectURL(
					new Blob([response.data])
				);
				const link = document.createElement("a");
				const date = new Date();
				const formattedDate = `${date.getFullYear()}-${String(
					date.getMonth() + 1
				).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

				link.href = url;
				link.setAttribute(
					"download",
					`CrucibleTree_${formattedDate}.csv`
				);
				document.body.appendChild(link);
				link.click();
				this.isLoading = false;
			} catch (error) {
				//TODO improve UI for alert window
				alert(`download file error: ${error}`);
			}
		},
	},
});
</script>

<style scoped>
.user-session {
	padding: 2rem;
}

.username-heading {
	margin: 0;
}

.logout-button {
	float: right;
}

.change-password-form {
	display: table;
	border-collapse: collapse;
}

.change-password-form > * {
	display: table-row;
}

.change-password-form > * > * {
	display: table-cell;
	border: 0;
	padding: 0.5rem;
}
</style>
