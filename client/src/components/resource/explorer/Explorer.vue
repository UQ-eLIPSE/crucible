<template>
	<ul
		class="resource-explorer"
		:class="resourceExplorerClasses"
	>
		<!-- Inline documents -->
		<div
			v-for="item in inlineDocuments"
			:key="item._id"
			:class="inlineDocumentClasses(item)"
			class="inline-document"
		>
			<div
				class="row"
				v-if="isSessionActive && !isViewportMobile"
			>
				<div
					v-if="isResourceHidden(item)"
					title="This resource has been hidden from non-admin users"
					class="inline-hidden"
				>
					HIDDEN
				</div>
				<button
					class="button small secondary"
					@click.stop.prevent="
						cutResource([item, ...regularDocuments], true)
					"
				>
					Cut
				</button>
				<button
					class="button small secondary"
					@click.stop.prevent="
						copyResource([item, ...regularDocuments], true)
					"
				>
					Copy
				</button>
				<button
					class="button small secondary"
					@click.stop.prevent="editResource(item._id)"
				>
					Edit
				</button>
			</div>
			<InlineDocumentInternal :item="item"></InlineDocumentInternal>
		</div>

		<div v-if="isSmartQuiz">
			<h1>Smart Quiz</h1>
			<h4>There are {{ smartQuizQuestions }} questions in this quiz</h4>
		</div>

		<!-- All other documents -->
		<li
			v-for="childItem in regularDocuments"
			class="list-item"
			:key="childItem._id"
		>
			<a
				class="list-item-link"
				:href="resourceLink(childItem)"
				:target="getLinkResourceTarget(childItem)"
				:class="routerLinkClasses(childItem)"
				@click.stop.prevent="openResource(childItem)"
			>
				<!-- Renders background only -->
				<div
					class="background"
					:class="backgroundClasses(childItem)"
					:style="backgroundStyles(childItem)"
				></div>

				<!-- Overlay for text labels etc. -->
				<div class="overlay">
					<span class="overlay-label">{{ childItem.label }}</span>
				</div>

				<!-- Edit controls available when logged in -->
				<ul
					v-if="isSessionActive && !isViewportMobile && !isSmartQuiz"
					class="edit-controls"
				>
					<!-- Removed cut and copy functionality from collections for now, will re-visit later if required -->
					<li v-if="!isCollection(childItem)">
						<a @click.stop.prevent="cutResource(childItem)">Cut</a>
					</li>
					<li v-if="!isCollection(childItem)">
						<a @click.stop.prevent="copyResource(childItem)"
							>Copy</a
						>
					</li>
					<li v-if="!isCollection(childItem)">
						<a @click.stop.prevent="editResource(childItem._id)" cy-data="edit-resource-button"
							>Edit</a
						>
					</li>
				</ul>
				<div
					v-if="isResourceHidden(childItem)"
					title="This resource has been hidden from non-admin users"
					class="hidden-label"
				></div>
			</a>
		</li>
	</ul>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import Api from "@/api";
import { defineComponent, PropType } from "vue";
import {
	Type as ResourceType,
	AuthMechanism,
	IResource_FromServer,
} from "../../../types/Resource";

import InlineDocumentInternal from "./InlineDocumentInternal.vue";
import { quizCollectionSnapshot } from "@/store/activeCollection";

export default defineComponent({
	name: "ResourceExplorer",
	components: {
		InlineDocumentInternal,
	},
	data() {
		return {
			smartQuizQuestions: quizCollectionSnapshot.data.length,
		};
	},
	props: {
		isSmartQuiz: {
			type: Boolean,
			required: false,
		},
		childrenItems: {
			type: Array as PropType<IResource_FromServer[]>,
			required: true,
		},
		activeChildItem: {
			type: Object as PropType<IResource_FromServer>,
			required: false,
			default: () => undefined,
		},
		displayLinearChildItemList: {
			type: Boolean,
			default: false,
		},
		/** Stores collection objects */
		collectionsPath: {
			type: Object as PropType<IResource_FromServer[]>,
			required: true,
		},
		/**
		 * Prop acts as a "promise pending lock" for async function "fetchPathData" in ResourceManager.
		 * Disables all resource links and waits for async operation to complete in resource manager.
		 */
		activated: {
			type: Boolean,
			required: false,
		},
	},
	computed: {
		inlineDocuments() {
			return this.childrenItems.filter(
				(x) =>
					x.type ===
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
		},
		regularDocuments() {
			return this.childrenItems.filter(
				(x) =>
					x.type !==
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
		},
		isSessionActive() {
			return this.$store.getters.isSessionActive;
		},
		isViewportMobile() {
			return this.$store.getters.isViewportMobile;
		},
		resourceExplorerClasses() {
			return {
				"linear-list": this.displayLinearChildItemList,
			};
		},
	},
	methods: {
		// ######################################## Classes and Styles #################################
		routerLinkClasses(child: any) {
			const classes: string[] = [];

			if (child === this.activeChildItem) {
				classes.push("active-child-item");
			}

			// Check if item hidden
			if (this.isResourceHidden(child)) {
				classes.push("hidden");
			}

			return classes;
		},
		backgroundClasses(childItem: any) {
			return {
				"background-image-defined": !!childItem.thumbnail,
			};
		},
		backgroundStyles(childItem: any) {
			const styles: { [prop: string]: string } = {};

			// Set thumbnail where present
			if (childItem.thumbnail) {
				styles.backgroundImage = `url(${childItem.thumbnail.url})`;
				styles.backgroundSize = childItem.thumbnail.size || "cover";
				if (this.isResourceHidden(childItem)) {
					styles.opacity = "0.3";
				}
			}

			return styles;
		},
		inlineDocumentClasses(item: any) {
			return {
				hidden: this.isResourceHidden(item),
			};
		},
		/**
		 * Returns if resource item is a Link (URL)
		 */
		isLinkResource(item: any) {
			return item.type === ResourceType.URL;
		},
		/**
		 * Opens link in new tab if resource type is ResourceType.URL
		 * @param childItem Resource
		 */
		getLinkResourceTarget(childItem: any) {
			return this.isLinkResource(childItem) ? "_blank" : undefined;
		},
		resourceLink(childItem: any) {
			if (this.isLinkResource(childItem)) {
				return childItem.content.url;
			}

			return (
				"#" + this.$router.currentRoute.value.path + "/" + childItem._id
			);
		},
		isCollection(item: any) {
			return (
				item.type === ResourceType.RESOURCE_COLLECTION ||
				item.type === ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE ||
				item.type === ResourceType.RESOURCE_COLLECTION_ROOT ||
				item.type === ResourceType.RESOURCE_COLLECTION_SMART_QUIZ
			);
		},
		appendLinkToPathOnOpen(childItem: any) {
			if (this.activeChildItem === undefined)
				return `${this.$router.currentRoute.value.path}/${childItem._id}`;
			else return childItem._id;
		},
		async openResource(childItem: any) {
			if (this.isLinkResource(childItem)) {
				window.open(childItem.content.url, "_blank");
				return;
			}

			// Only open the resource if the component is "activated"
			// (permitted to navigate)
			if (this.activated) {
				// If this is a smart quiz then we call the api to give us new randomised quiz questions
				if (
					childItem.type ===
					ResourceType.RESOURCE_COLLECTION_SMART_QUIZ
				) {
					this.smartQuizQuestions = childItem.content.numQuestions;

					// save the smart quiz id, we will use this in out snapshot functionality
					quizCollectionSnapshot.smartQuizId = childItem._id;
					const smartQuizSnapshot =
						await Api.Resource.getSmartQuizQuestions(childItem);

					// if not snapshot exists then
					// we save this set of questions and retrieve this snapshot in Resource Manager
					if (quizCollectionSnapshot.isSnapShot !== true) {
						quizCollectionSnapshot.data = smartQuizSnapshot.data;
						quizCollectionSnapshot.isSnapShot = true;
					}
				}

				// Only append when there is no active child item
				// and append if we are not in quiz mode i.e the childItem is not a question
				this.$router.push({
					path: this.appendLinkToPathOnOpen(childItem),
				});

				// if we clicked a 101 then lets change the active child
				if (childItem.type === 101)
					quizCollectionSnapshot.data.activeChild =
						quizCollectionSnapshot.data.filter(
							(question: IResource_FromServer) => {
								return question._id === childItem._id;
							}
						)[0]._id;
			}
		},

		isResourceHidden(child: any) {
			return (
				child &&
				child.permissions &&
				child.permissions.auth &&
				child.permissions.auth![AuthMechanism.internal] &&
				child.permissions.auth![AuthMechanism.internal].hidden
			);
		},
		async editResource(id: string) {
			// Build URL from ids of collection objects
			const path =
				"/resource/edit/" +
				this.collectionsPath
					.map((collection: any) => collection._id)
					.join("/") +
				"/" +
				id;
			await this.$router.push(path);
		},
		copyResource(item: any | any[], allItems = false) {
			allItems
				? this.$store.commit("COPY_ALL_ITEMS", item)
				: this.$store.commit("COPY_ITEM", item);
		},

		cutResource(item: any | any[], allItems = false) {
			allItems
				? this.$store.commit("CUT_ALL_ITEMS", item)
				: this.$store.commit("CUT_ITEM", item);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style scoped>
@import "@/assets/styles/resource/Explorer.css";
</style>
