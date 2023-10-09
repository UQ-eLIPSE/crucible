<template>
	<div>
		<div
			v-for="(alertMessage, i) in alertManagerState.alertMessages"
			:key="i"
			v-show="alertMessage.message.length > 0"
			:class="alertMessage.class"
			class="error-message-container"
		>
			<p v-text="alertMessage.message"></p>

			<span
				class="delete-button-small"
				@click.prevent="alertManagerState.removeAlertMessage(i)"
				>&#10006;</span
			>
		</div>
	</div>
</template>
<!-- ################################################### -->

<script lang="ts">
import AlertManager from "@/utils/AlertManager";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "AlertDisplay",
	props: {
		alertManager: {
			type: Object as PropType<AlertManager>,
			required: true,
		},
	},
	emits: ["update:alertManager"],
	computed: {
		alertManagerState: {
			get() {
				return this.alertManager;
			},
			set(alertState: AlertManager) {
				this.$emit("update:alertManager", alertState);
			},
		},
	},
});
</script>

<style lang="scss" scoped>
/* ALERT MESSAGES */

.alert {
	padding: 1rem 0 1rem;
}

.error {
	background-color: #f2dede;
	color: #a94442;
	padding: 1rem;
}

.warning {
	background-color: #fcf8e3;
	color: #8a6d3b;
	padding: 1rem;
}

.success {
	background-color: #dff0d8;
	color: #3c763d;
	padding: 1rem;
}

.error-message-container {
	display: flex;
	justify-content: space-between;
	margin: 0.1rem 0.2rem 0.1rem;
}

.delete-button-small {
	align-self: center;
	height: 2rem;
	color: inherit;
	text-align: center;
	padding: 0.3rem;
}

.delete-button-small:hover {
	cursor: pointer;
	color: lightcoral;
}
</style>
