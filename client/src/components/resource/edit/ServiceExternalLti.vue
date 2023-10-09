<template>
	<div class="resource-edit-document-external field">
		<div class="field">
			<label>
				<span class="field-label">Launch URL</span>
				<input
					type="text"
					v-model="resourceEdit.content.launchUrl"
				/>
			</label>
		</div>

		<div class="field">
			<label>
				<span class="field-label">Consumer key</span>
				<input
					type="text"
					v-model="resourceEdit.content.consumerKey"
				/>
			</label>
		</div>

		<div class="field">
			<label>
				<span class="field-label">Secret</span>
				<input
					type="text"
					v-model="resourceEdit.content.secret"
				/>
			</label>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_Base } from "@/types/Resource";

interface IResource_Service_External_Lti extends IResource_Base {
	content: {
		launchUrl: string;
		consumerKey: string;
		secret: string;
	};
}

export default defineComponent({
	name: "ServiceExternalLti",
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<IResource_Service_External_Lti>,
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
	computed: {
		resourceEdit: {
			get() {
				return this.resource;
			},
			set(resource: IResource_Service_External_Lti) {
				this.$emit("update:resource", resource);
			},
		},
	},
});
</script>

<!-- ####################################################################### -->

<style scoped src="@/assets/styles/global/ResourceEdit.css"></style>
