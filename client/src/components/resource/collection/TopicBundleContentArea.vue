<template>
	<div class="resource-collection-topic-bundle-content-area">
		<ResourceExplorer
			class="resource-explorer"
			v-if="displayItemList"
			:class="resourceExplorerClasses"
			:childrenItems="childrenItems"
			:activeChildItem="activeChildItem"
			:displayLinearChildItemList="true"
			:activated="activated"
			:collectionsPath="collectionsPath"
			:isSmartQuiz="isSmartQuiz"
		></ResourceExplorer>
		<div
			class="controls-mid"
			v-if="isViewportDesktop"
		>
			<div class="top">
				<button
					class="control list-control"
					:title="displayItemList ? 'Hide list' : 'Show list'"
					type="button"
					@click="toggleTopicItems"
				>
					{{ toggleTopicText }}
				</button>
			</div>
			<div class="bottom">
				<button
					class="control nav"
					:disabled="!!!previousChildItem"
					:title="getChildItemTitle(previousChildItem)"
					type="button"
					@click="gotoPreviousChildItem()"
				>
					&#8679;
				</button>
				<button
					class="control nav"
					:disabled="!!!nextChildItem"
					:title="getChildItemTitle(nextChildItem)"
					type="button"
					@click="gotoNextChildItem()"
				>
					&#8681;
				</button>
			</div>
		</div>
		<ResourceDisplay
			v-if="isViewportDesktop"
			class="resource-display"
			:class="resourceDisplayDesktopClasses"
			:showCloseButton="false"
			:item="activeChildItem"
			:isSmartQuiz="isSmartQuiz"
		></ResourceDisplay>

		<ResourceDisplay
			v-else-if="
				activeChildItem && (isViewportMobile || isViewportTablet)
			"
			class="resource-display"
			:showCloseButton="true"
			:item="activeChildItem"
			@close="closeResourceDisplay"
			:isSmartQuiz="isSmartQuiz"
		></ResourceDisplay>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import ResourceExplorer from "../explorer/Explorer.vue";
import ResourceDisplay from "../display/ResourceDisplay.vue";
import { IResource_FromServer, Type as ResourceType } from "@/types/Resource";
import { defineComponent, PropType } from "vue";
import { quizCollectionSnapshot } from "@/store/activeCollection";

export default defineComponent({
	name: "TopicBundle",
	components: {
		ResourceExplorer,
		ResourceDisplay,
	},
	props: {
		isSmartQuiz: {
			type: Boolean,
			required: true,
		},
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
	data() {
		return {
			displayItemList: true,
		};
	},
	computed: {
		toggleTopicText() {
			return this.displayItemList ? " < " : " ☰ ";
		},
		resourceExplorerClasses() {
			return {
				"open-resource": this.activeChildItem,
				collapsed: !this.displayItemList,
			};
		},
		isViewportMobile() {
			return this.$store.getters.isViewportMobile as boolean;
		},
		isViewportTablet() {
			return this.$store.getters.isViewportTablet as boolean;
		},
		isViewportDesktop() {
			return this.$store.getters.isViewportDesktop as boolean;
		},
		resourceDisplayDesktopClasses() {
			return {
				expanded: !this.displayItemList,
			};
		},

		regularDocuments() {
			return this.childrenItems.filter(
				(x) =>
					x.type !==
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
		},
		activeChildItemIndex() {
			if (!this.activeChildItem) return -1;
			return this.regularDocuments.findIndex(
				(child) => child._id === this.activeChildItem._id
			);
		},

		nextChildItem() {
			const currentIndex = this.activeChildItemIndex;

			if (
				currentIndex < this.regularDocuments.length - 1 &&
				currentIndex >= 0
			) {
				return this.regularDocuments[currentIndex + 1];
			}

			return null;
		},
		previousChildItem() {
			const currentIndex = this.activeChildItemIndex;

			if (
				currentIndex > 0 &&
				currentIndex <= this.regularDocuments.length - 1
			) {
				return this.regularDocuments[currentIndex - 1];
			}

			return null;
		},
	},
	methods: {
		toggleTopicItems() {
			this.displayItemList = !this.displayItemList;
		},

		closeResourceDisplay() {
			// Close the resource display by going up one level (the current
			// component route)
			this.$router.push(".");
		},
		/**
		 * Returns if resource item is a Link (URL)
		 */
		isLinkResource(item: any) {
			return item.type === ResourceType.URL;
		},

		openResource(childItem: any) {
			// we update the active childItem id for smart quiz questions
			if (this.isSmartQuiz) {
				quizCollectionSnapshot.data.activeChild = childItem._id;
			}
			if (this.isLinkResource(childItem)) {
				window.open(childItem.content.url, "_blank");
				return;
			}
			// Only open the resource if the component is "activated"
			// (permitted to navigate)
			if (this.activated) {
				this.$router.push({
					path: childItem._id,
				});
			}
		},
		gotoPreviousChildItem() {
			if (this.previousChildItem)
				this.openResource(this.previousChildItem);
		},

		gotoNextChildItem() {
			if (this.nextChildItem) this.openResource(this.nextChildItem);
		},

		getChildItemTitle(childItem: any) {
			if (!this.activeChildItem) return "Select a resource to navigate";
			if (!childItem || !childItem.label) return "";
			return "Resource: " + childItem.label;
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-collection-topic-bundle-content-area {
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

.expanded {
	flex-basis: 99%;
}

.viewport-mobile .resource-display,
.viewport-tablet .resource-display {
	flex-basis: 100%;
}

.viewport-mobile .resource-explorer {
	padding: 0.7rem 1rem 0.7rem;
}

.viewport-mobile .resource-explorer.open-resource,
.viewport-tablet .resource-explorer.open-resource {
	display: none;
}

.collapsed {
	flex-basis: 0%;
}

.controls-mid {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.controls-mid > * {
	display: flex;
	flex-direction: column;
}

.control {
	background: #49075e;
	display: inline-block;
	padding: 0.8rem;
	border: 1px solid rgba(55, 5, 70, 0.3);
	border-radius: 0.2rem;
	font-family: inherit;
	font-size: 0.9em;
	font-weight: 400;
	text-transform: uppercase;
	color: #fff;
	cursor: pointer;
	box-shadow: transparent 0 0.2rem 0.5rem;
	transition: all 100ms linear;
	border: 0.08rem solid rgba(166, 140, 173, 0.9);
}

.control:hover:not([disabled]) {
	background: #858;
	box-shadow: rgba(55, 5, 70, 0.3) 0 0.2rem 0.5rem;
	border: 0.08rem solid rgba(55, 5, 70, 0.3);
}

.bottom {
	position: relative;
}

button[disabled="disabled"] {
	background: darkgray;
}

button[disabled="disabled"]:hover {
	background: darkgray;
}

.list-control {
	border-radius: 100%;
	padding: 0.2rem;
	border: none;
	width: 2rem;
	height: 2rem;
	margin: 0.8rem 0.4rem;
	box-shadow: 0px 17px 10px -10px rgba(0, 0, 0, 0.4);
}

.list-control:hover {
	box-shadow: 0px 37px 20px -15px rgba(0, 0, 0, 0.2);
}
</style>
