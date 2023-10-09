<template>
	<div class="resource-display-service-external-lti">
		<template v-if="isEditPreviewMode">
			<p>LTI tools are not able to be previewed.</p>
		</template>
		<template v-else>
			<p class="center">
				Click "Launch LTI tool" to open this external resource.
			</p>
			<p class="center">
				<button
					class="button"
					@click="launchLtiTool"
				>
					Launch LTI tool
				</button>
			</p>
		</template>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	props: {
		item: {
			type: Object as PropType<IResource_FromServer>,
			required: true,
		},
		/** Indicates if the display is for previewing during edits */
		isEditPreviewMode: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		launchUrl() {
			return `/service/external/lti/launch/${this.item._id}`;
		},
	},
	methods: {
		launchLtiTool() {
			window.open(this.launchUrl);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-display-service-external-lti {
	padding: 2rem;
}

.center {
	text-align: center;
}
</style>
