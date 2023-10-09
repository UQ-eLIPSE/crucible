<template>
	<div class="resource-edit-document-external field">
		<label>
			<span class="field-label">Link</span>
			<input
				v-if="isNewUpload"
				v-model="resourceEdit.content.url"
			/>

			<!-- Input is readonly, text gets selected on click -->
			<input
				v-else
				type="text"
				@click="selectField($event)"
				readonly
				:value="resourceEdit.content.url"
			/>
		</label>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_Document_External } from "@/types/Resource";

export default defineComponent({
	name: "DocumentExternal",
	props: {
		/** Input resource item */
		resource: {
			type: Object as PropType<IResource_Document_External>,
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
			set(resource: IResource_Document_External) {
				this.$emit("update:resource", resource);
			},
		},
		isNewUpload() {
			return !this.isEdit;
		},
	},
	methods: {
		/** Selects the contents of the input field */
		selectField(e: MouseEvent) {
			(e.currentTarget as HTMLInputElement).select();
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";

/* Makes readonly inputs look like disabled */

input[readonly] {
	border-color: darkgrey;
	border-style: solid;
	border-width: 1px;
	background-color: rgb(235, 235, 228);
	color: rgb(84, 84, 84);
}
</style>
