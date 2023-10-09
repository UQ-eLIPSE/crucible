<template>
	<div>
		<iframe
			:src="item.content.url"
			:allowfullscreen="true"
		></iframe>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "VideoExternalKaltura",
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
div {
	display: flex;
	flex-direction: column;

	color: #fff;
	background: #222;

	padding: 2rem;
}

iframe {
	flex-grow: 1;

	background: #000;

	border: 0;
	margin: 0;
	padding: 0;
}
</style>
