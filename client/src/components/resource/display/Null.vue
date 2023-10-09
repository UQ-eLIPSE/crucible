<template>
	<div>This resource item does not have content.</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "NullItem",
	props: {
		item: {
			type: Object as PropType<IResource_FromServer>,
			required: true,
		},
	},
});
</script>

<!-- ####################################################################### -->
