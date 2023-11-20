<template>
	<div class="user-session-login">
		<div class="wrapper">
			<h1>Admin</h1>
			<form
				class="login-form"
				@submit.prevent="logIn()"
			>
				<div class="input-fields">
					<label>
						<span>Username</span>
						<div>
							<input
								type="text"
								v-model="loginValue.username"
								cy-data="username-field"
								autofocus
							/>
						</div>
					</label>
					<label>
						<span>Password</span>
						<div>
							<input
								type="password"
								cy-data="password-field"
								v-model="loginValue.password"
							/>
						</div>
					</label>
				</div>
				<input
					type="submit"
					class="button"
					value="Log in"
					cy-data="login-button"
				/>
			</form>
			<div
				v-if="loginMessage"
				class="inline-message-box negative"
			>
				{{ loginMessageOutput }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { SuccessMessage } from "../types/SuccessMessage";
import { ActionTypes } from "../store/user_session";

/**
 * This component handles the user login input and error messages
 * - Login details get dispatched to the store
 * - If they don't match details in database an error message appears
 */
export default defineComponent({
	data: function () {
		return {
			loginValue: {
				username: "",
				password: "",
			},
			loginMessage: undefined as SuccessMessage | undefined,
		};
	},
	watch: {
		loginValue: {
			handler() {
				// Remove any message once someone attempts a change in the fields
				this.clearLoginMessage();
			},
			deep: true,
		},
	},
	computed: {
		loginMessageOutput() {
			return (
				this.loginMessage &&
				this.loginMessage.messages &&
				this.loginMessage.messages.join("; ")
			);
		},
	},
	methods: {
		logIn: async function () {
			const { username, password } = this.loginValue;

			try {
				await this.$store.dispatch(ActionTypes.LogInLocal, {
					username,
					password,
				});
			} catch (e: any) {
				let message = "Login not successful";

				// Check to see if the error has a response from the server;
				// append message from server if available
				if (e.response && e.response.data && e.response.data.error) {
					message += ` (${e.response.data.error})`;
				}

				this.setLoginMessage(false, [message]);
				return;
			}

			// Once logged in, return to where you came from
			const returnPath = (this.$route.query.returnTo || "/") as string;
			this.$router.push(returnPath);
		},
		clearLoginMessage() {
			this.loginMessage = undefined;
		},
		setLoginMessage(success: boolean, messages: string[]) {
			return (this.loginMessage = {
				success,
				messages,
			});
		},
	},
});
</script>

<style lang="scss" scoped>
.user-session-login {
	display: flex;

	align-items: center;
	justify-content: center;
}

.wrapper {
	padding: 2rem;
	background: rgba(255, 255, 255, 0.85);
	border: 0.05rem solid #ddd;
	border-radius: 0.5rem;
	box-shadow: 0 0.1rem 1rem 0 rgba(0, 0, 0, 0.2);
	text-align: center;

	max-width: 100em;

	/** IE specific fixes **/
	/* Fixes unbounded container width */
	min-width: 1px;
}

.login-form {
	margin-bottom: 0.5rem;
}

.input-fields {
	display: table;
	border-collapse: collapse;
}

.input-fields > * {
	display: table-row;
}

.input-fields > * > * {
	display: table-cell;
	border: 0;
	padding: 0 0.5rem 0.5rem 0.5rem;
}

.input-fields > * > span {
	/** Right align the field labels */
	text-align: right;
}
</style>
