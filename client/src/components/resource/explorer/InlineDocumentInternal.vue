<template>
	<!-- Note that this injects raw HTML straight into the component -->
	<div
		class="resource-explorer-document"
		v-html="item.content.html"
	></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "InlineDocumentInternal",
	props: {
		item: {
			type: Object as PropType<any>,
			required: true,
		},
	},
});
</script>

<style scoped>
.resource-explorer-document {
	margin: 0.5rem;
}

/* Mobile styles */

.viewport-mobile .resource-explorer-document {
	margin: 0;
}
</style>
