<template>
	<div>
		<video
			:src="item.content.url"
			controls
			:autoplay="autoplay"
		></video>
	</div>
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
		autoplay: {
			type: Boolean,
			required: false,
			default: true,
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

video {
	flex-grow: 1;

	background: #000;

	border: 0;
	margin: 0;
	padding: 0;

	/* This is defined as "0" in order for the video to be collapsible into a
     small container; note that `flex-grow`` will automatically resize the video 
     to fit the container
     
     BOTH `height`, `min-height`` required due to differences in browser 
     behaviour */
	height: 0;
	min-height: 0;
}
</style>
