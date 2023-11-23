<template>
	<div class="resource-manager">
		<div class="top-bar">
			<ResourcePathBreadcrumbs
				class="breadcrumbs"
				:pathItems="collectionsPath"
			></ResourcePathBreadcrumbs>

			<!-- Create resource only if logged in -->
			<div class="controls">
				<a
					v-if="
						isSessionActive && activeCollection && !isViewportMobile
					"
					@click.prevent.stop="createResource"
					class="button"
					cy-data="create-resource-button"
					>Create New
				</a>
			</div>
		</div>

		<!-- Error -->
		<p v-if="pathFetchError">Error: {{ pathFetchError }}</p>
		<div
			class="clipboard"
			v-if="!isViewportMobile"
		>
			<Clipboard
				@success="clipboardSuccessHandler"
				@updated="activeCollection = $event"
				:activeCollection="activeCollection"
				:activeChildItem="activeChildItem"
			></Clipboard>
		</div>
		<!-- Split panel for resources -->
		<div
			v-if="!pathFetchError"
			class="content-area"
		>
			<component
				v-if="activeCollection"
				:is="contentAreaComponent"
				:childrenItems="availableChildrenItems"
				:activeChildItem="activeChildItem"
				:activated="explorerActivated"
				:collectionsPath="collectionsPath"
				:isSmartQuiz="isSmartQuiz"
			></component>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { RouteLocationNormalized } from "vue-router";

import Api from "../api";
import FileSelectorOneWay from "@/components/FileSelectorOneWay.vue";
import ReorderResources from "@/components/resource/ReorderResources.vue";

import {
	Type as ResourceType,
	AuthMechanism,
	IResource_FromServer,
} from "../types/Resource";

import ResourcePathBreadcrumbs from "../components/resource/PathBreadcrumbs.vue";
import StandardContentArea from "../components/resource/collection/StandardContentArea.vue";
import TopicBundleContentArea from "../components/resource/collection/TopicBundleContentArea.vue";
import { defineComponent } from "vue";
import { AxiosError } from "axios";
import Clipboard from "../components/Clipboard.vue";
import { quizCollectionSnapshot } from "@/store/activeCollection";

export default defineComponent({
	components: {
		ResourcePathBreadcrumbs,
		FileSelectorOneWay,
		ReorderResources,
		Clipboard,
	},
	data() {
		return {
			collectionsPath: [] as IResource_FromServer[],
			childrenItems: [] as IResource_FromServer[],
			activeChildItem: undefined as IResource_FromServer | undefined,
			pathFetchError: undefined as string | undefined,
			isSmartQuiz: undefined as boolean | undefined,
			/** Locking mechanism for disabling resource explorer links unless fetchPathData promise is resolved */
			explorerActivated: true,
		};
	},
	/**
	 * Reacts to when the component is first instantiated
	 */
	created() {
		this.loadResourceData();
	},
	computed: {
		clipboardItemExists() {
			return this.$store.getters.clipboardItemExists;
		},
		availableChildrenItems() {
			return this.childrenItems.filter((child) => {
				if (this.isSessionActive) {
					// If logged in as admin, display child item
					return true;
				}

				return !(
					child.permissions &&
					child.permissions.auth &&
					child.permissions.auth[AuthMechanism.internal] &&
					child.permissions.auth[AuthMechanism.internal].hidden
				);
			});
		},
		activeCollection() {
			// Last collection in collections path
			return this.collectionsPath[this.collectionsPath.length - 1];
		},
		isViewportMobile() {
			return this.$store.getters.isViewportMobile as boolean;
		},
		contentAreaComponent() {
			// If there are no collections, then we can't render
			if (this.activeCollection === undefined) {
				return undefined;
			}
			// Topic bundles and smart quizzes have their own content area component
			if (
				this.activeCollection.type ===
					ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE ||
				this.activeCollection.type ===
					ResourceType.RESOURCE_COLLECTION_SMART_QUIZ
			) {
				return TopicBundleContentArea;
			}

			// Return standard content area otherwise
			return StandardContentArea;
		},
		resourceTitle() {
			if (this.activeChildItem !== undefined) {
				return `[Resource] ${this.activeChildItem.label}`;
			}

			return `[Collection] ${this.activeCollection.label}`;
		},

		isSessionActive() {
			return this.$store.getters.isSessionActive;
		},
	},
	watch: {
		/**
		 * Watches for activeCollection changes and checks if smart quiz or not
		 */
		activeCollection: {
			handler: function (newVal: IResource_FromServer) {
				// Check if parent collection is a smart quiz
				if (newVal.type === ResourceType.RESOURCE_COLLECTION_SMART_QUIZ)
					this.isSmartQuiz = true;
			},
		},
		/**
		 * Watches for contentAreaComponent changes and checks if resource
		 * is a smart quiz and set the check to true
		 */
		contentAreaComponent: {
			handler: function (newVal: IResource_FromServer) {
				// Set default smart quiz value to false
				this.isSmartQuiz = false;
				// Check if resource is a smart quiz
				if (newVal.type === ResourceType.RESOURCE_COLLECTION_SMART_QUIZ)
					this.isSmartQuiz = true;
			},
		},
	},
	/**
	 * Reacts to changes in route (e.g. when navigating through resources) when
	 * the component is reused
	 */
	beforeRouteUpdate(
		to: RouteLocationNormalized,
		_from: RouteLocationNormalized,
		next: Function
	) {
		// params.pathMatch is everything after /resource/
		this.loadResourceData(to.params.pathMatch as string[]).then(() => {
			// Only proceed when we have got the data loaded
			next();
		});
	},
	methods: {
		onFileSelect() {
			window.alert("File selected");
		},
		createResource() {
			this.$router.push(
				"/resource/new/" +
					(this.$route.params.pathMatch as string[]).join("/")
			);
		},
		clipboardSuccessHandler() {
			// Once clipboard operation is successful, reload data
			this.loadResourceData();
		},
		async fetchPathData(paths: string[]) {
			// Strip first slash if present
			for (let path in paths) {
				if (path[0] === "/") {
					path = path.substring(1);
				}
			}
			try {
				let result = await Api.Resource.getPath(paths);
				// if the paths contain a smart quiz id we will access the "saved"
				// smart quiz questions list
				if (paths.includes(quizCollectionSnapshot.smartQuizId)) {
					// we are making sure we have saved collection of questions
					if (quizCollectionSnapshot.data) {
						result.data.children = quizCollectionSnapshot.data;
						// this is needed for users to click on a question
						// and get the question info
						result.data.activeChild =
							quizCollectionSnapshot.data.activeChild;
					}
				} else {
					// We "reset" our save functionality, when the user is
					// no longer in a smart quiz collection
					quizCollectionSnapshot.isSnapShot = false;
					quizCollectionSnapshot.smartQuizId = "";
				}

				const response: any = result.data;
				// Put data into component's private data
				const { collections, children, activeChild } = response;

				let activeChildItem: any | undefined = undefined;
				if (activeChild !== null) {
					activeChildItem = children.find(
						(child: any) => child._id === activeChild
					);
				}

				this.collectionsPath = collections;
				this.childrenItems = children;
				this.activeChildItem = activeChildItem;
				this.pathFetchError = undefined;
			} catch (e) {
				// Handle errors
				let errorMessage = "Unspecified error";

				if (e instanceof AxiosError && e.response) {
					errorMessage = e.response.data.error;
				}

				this.collectionsPath = [];
				this.childrenItems = [];
				this.activeChildItem = undefined;
				this.pathFetchError = errorMessage;
			}
		},
		async loadResourceData(path: string[] = this.$route.params.pathMatch) {
			// Disable explorer while loading data
			this.explorerActivated = false;
			// The default value for path is = params.pathMatch, which is everything after
			// "/resource/" in the route
			await this.fetchPathData(path);

			// Renable explorer
			this.explorerActivated = true;
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-manager {
	display: flex;
	flex-direction: column;
	height: 85vh;
}

.content-area {
	flex-grow: 1;
	position: relative;
}

.content-area > * {
	position: absolute;

	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.top-bar {
	background: #fff;
	box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.08);
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.controls {
	margin: 0 1.8rem 0;
	flex-shrink: 0;
}

.controls > a {
	text-decoration: none;
	padding: 0.6rem 1rem;
}

.breadcrumbs {
	overflow-x: auto;
}

/* Tablet styles */

.viewport-tablet .controls {
	margin: 0 0.8rem 0;
}
</style>
