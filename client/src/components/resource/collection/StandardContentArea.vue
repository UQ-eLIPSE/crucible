<template>
	<div class="resource-collection-standard-content-area">
		<ResourceExplorer
			class="resource-explorer"
			:class="resourceExplorerClasses"
			ref="resource-explorer"
			:childrenItems="childrenItems"
			:activeChildItem="activeChildItem"
			:activated="activated"
			:collectionsPath="collectionsPath"
		></ResourceExplorer>

		<ResourceDisplay
			v-if="activeChildItem"
			class="resource-display"
			:item="activeChildItem"
			@close="closeResourceDisplay"
		></ResourceDisplay>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import ResourceExplorer from "../explorer/Explorer.vue";
import ResourceDisplay from "../display/ResourceDisplay.vue";
import { IResource_FromServer } from "@/types/Resource";

export default defineComponent({
	name: "StandardContent",
	components: {
		ResourceExplorer,
		ResourceDisplay,
	},
	props: {
		childrenItems: {
			type: Array as PropType<IResource_FromServer[]>,
			required: true,
		},
		activeChildItem: {
			type: Object as PropType<IResource_FromServer>,
			required: false,
		},
		/** Locking mechanism for disabling resource explorer links unless fetchPathData promise in ResourceManager is resolved */
		activated: {
			type: Boolean,
			required: false,
		},
		/** Stores collection objects present on path */
		collectionsPath: {
			type: Object as PropType<IResource_FromServer>,
			required: true,
		},
	},
	computed: {
		resourceExplorerClasses() {
			return {
				"open-resource": this.activeChildItem,
			};
		},
	},
	methods: {
		closeResourceDisplay() {
			// Close the resource display by going up one level (the current
			// component route)
			this.$router.push(".");
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-collection-standard-content-area {
	display: flex;
	flex-direction: row;
}

.resource-explorer {
	flex-grow: 1;
}

.resource-display {
	flex-shrink: 0;
	/* Gives enough room for 2 columns on the left */
	width: calc(100% - 46.2rem);
}

.viewport-mobile .resource-display,
.viewport-tablet .resource-display {
	flex-basis: 100%;
}

.viewport-mobile .resource-explorer.open-resource,
.viewport-tablet .resource-explorer.open-resource {
	display: none;
}
</style>
