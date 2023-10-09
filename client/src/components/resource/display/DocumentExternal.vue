<template>
	<iframe
		class="resource-display-document-external"
		:src="item.content.url"
		allowfullscreen
	>
	</iframe>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "DocumentExternal",
	props: {
		item: {
			type: Object as PropType<IResource_FromServer>,
			required: true,
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-display-document-external {
	min-width: 1px;
	min-height: 1px;
	height: 100vh;
	margin: 0;
	border: 0;
	background: transparent;
}
</style>
