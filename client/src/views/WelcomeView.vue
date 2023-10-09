<template>
	<main
		class="welcome"
		:class="welcomePanelClasses"
		id="welcome"
	>
		<div
			v-if="displayWelcomeContainer"
			class="inner-container"
		>
			<h1>{{ applicationHeaderText }}</h1>

			<ul class="collection-roots">
				<li
					v-for="root in collectionRoots"
					:key="root._id"
				>
					<router-link
						:to="generateCollectionLink(root._id)"
						:style="backgroundStyles(root)"
					>
						<span>{{ root.label }}</span>
					</router-link>
				</li>
			</ul>
		</div>
	</main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Config from "../../config.json";
import Api from "../api";
import { IResource_FromServer } from "../types/Resource";
import { DefaultConfig } from "../utils/IdentitySetup";

export default defineComponent({
	name: "Welcome-View",
	props: {
		resourcePathPrefix: {
			type: String,
			required: false,
			default: "/resource",
		},
	},
	data: function () {
		return {
			collectionRoots: [] as IResource_FromServer[],
		};
	},
	created() {
		this.fetchData();
	},
	computed: {
		randomBackgroundImageLabel() {
			if (
				Config &&
				Config.BRANDING &&
				Config.BRANDING.NUM_SPLASH_IMAGES
			) {
				const randn =
					(Math.random() * Config.BRANDING.NUM_SPLASH_IMAGES) >>> 0;
				return randn;
			}

			return null;
		},
		welcomePanelClasses() {
			const classes: string[] = [];
			// Generate random background image
			classes.push(
				`img${
					this.randomBackgroundImageLabel === null
						? "color"
						: this.randomBackgroundImageLabel
				}`
			);

			return classes;
		},
		applicationHeaderText() {
			if (Config && Config.BRANDING && Config.BRANDING.HEADER_TEXT) {
				return Config.BRANDING.HEADER_TEXT;
			}
			return DefaultConfig.BRANDING.HEADER_TEXT;
		},
		displayWelcomeContainer() {
			return this.collectionRoots.length !== 0;
		},
	},
	methods: {
		fetchData: async function () {
			// TODO: Handle errors!
			const result = await Api.Resource.getRoot();

			const collectionRoots: IResource_FromServer[] = result.data;

			this.collectionRoots = collectionRoots;
		},
		generateCollectionLink(collectionId: string) {
			return `${this.resourcePathPrefix}/${collectionId}`;
		},
		backgroundStyles(childItem: any) {
			const styles: { [prop: string]: string } = {};

			// Set thumbnail where present
			if (childItem.thumbnail) {
				styles.backgroundImage = `url(${childItem.thumbnail.url})`;
				styles.backgroundSize = childItem.thumbnail.size || "cover";
			}

			return styles;
		},
	},
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/view/WelcomeView.css";
</style>
