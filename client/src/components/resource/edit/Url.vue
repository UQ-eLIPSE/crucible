<template>
	<div class="resource-edit-url field">
		<label>
			<span class="field-label">URL</span>
			<div
				v-if="urlMessage"
				class="inline-message-box"
				:class="urlMessageClasses"
			>
				{{ urlMessageOutput }}
			</div>
			<input
				type="text"
				v-model="resourceEdit.content.url"
			/>
		</label>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { IResource_Url } from "@/types/Resource";
import { SuccessMessage } from "@/types/SuccessMessage";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "ResourceUrl",
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<IResource_Url>,
			required: true,
		},
		/** Indicates if this component is in "edit mode" or not */
		isEdit: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["update:resource"],
	data() {
		return {
			urlMessage: undefined as SuccessMessage | undefined,
		};
	},
	computed: {
		resourceEdit: {
			get() {
				return this.resource;
			},
			set(resource: IResource_Url) {
				this.$emit("update:resource", resource);

				// Remove any message once someone attempts a change
				this.clearUrlMessage();
			},
		},

		urlMessageClasses() {
			const classes: string[] = [];

			if (this.urlMessage !== undefined) {
				classes.push(this.urlMessage.success ? "positive" : "negative");
			}

			return classes;
		},

		urlMessageOutput() {
			return (
				this.urlMessage &&
				this.urlMessage.messages &&
				this.urlMessage.messages.join("; ")
			);
		},
	},
	methods: {
		validate(): SuccessMessage {
			// Check that the URL is not empty
			if (this.resourceEdit.content.url.trim().length === 0) {
				return {
					success: false,
					messages: ["URL is empty"],
				};
			}

			this.clearUrlMessage();

			// Successful validation
			return {
				success: true,
			};
		},
		clearUrlMessage() {
			this.urlMessage = undefined;
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";
</style>
