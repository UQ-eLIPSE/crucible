<template>
	<!-- Note that this injects raw HTML straight into the component -->
	<div
		class="document"
		v-html="item.content.html"
	></div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "DocumentInternal",
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
.document {
	flex-shrink: 0;
	overflow-wrap: break-word;
	/* Overflow misbehaving, will revisit later */
	/* overflow-y: auto; */
	padding: 2rem;
}

/* Mobile Styles */

.viewport-mobile .document {
	padding: 1rem;
}
</style>
