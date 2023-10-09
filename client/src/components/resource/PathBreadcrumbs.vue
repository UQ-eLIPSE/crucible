<template>
	<div class="resource-path-breadcrumbs">
		<ul
			ref="breadcrumb-list-ul"
			:class="ulClasses"
		>
			<li
				v-for="crumb in breadcrumbs"
				:key="crumb._id"
			>
				<router-link
					:to="crumb.path"
					:title="crumb.label"
					>{{ crumb.label }}
				</router-link>
			</li>
			<li
				v-if="isEditButtonAvailable"
				class="edit-link"
			>
				<a
					@click.prevent.stop="editActiveCollection"
					class="button small"
					>Edit</a
				>
			</li>
		</ul>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { IResource_FromServer } from "@/types/Resource";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "PathBreadcrumbs",
	props: {
		pathPrefix: {
			type: String,
			required: false,
			default: "/resource",
		},
		pathItems: {
			type: Array as PropType<IResource_FromServer[]>,
			required: false,
			default: () => [],
		},
		/** Hides/displays the edit button for active collection */
		displayEditButton: {
			type: Boolean,
			required: false,
			default: () => true,
		},
	},
	updated() {
		const breadcrumbs = this.$refs[
			"breadcrumb-list-ul"
		] as HTMLUListElement;
		breadcrumbs.scrollLeft = breadcrumbs.scrollWidth;
	},
	computed: {
		breadcrumbs() {
			// We incrementally build the path as we go along
			let path = this.pathPrefix;

			return this.pathItems.map((pathItem) => {
				const { _id, label } = pathItem;

				// Append ID to path
				path += `/${_id}`;

				// Encode breadcrumbs
				return {
					_id,
					path,
					label,
				};
			});
		},
		isSessionActive() {
			return this.$store.getters.isSessionActive;
		},
		isViewportMobile() {
			return this.$store.getters.isViewportMobile;
		},
		isEditButtonAvailable() {
			return (
				this.isSessionActive &&
				!this.isViewportMobile &&
				this.pathItems.length >= 1 &&
				this.displayEditButton
			);
		},

		ulClasses() {
			return {
				"edit-link-on": this.isEditButtonAvailable,
			};
		},
	},
	methods: {
		editActiveCollection() {
			// Get the ids from pathItems and create a path
			const collectionIds = this.pathItems.map((col: any) => col._id);
			this.$router.push(`/resource/edit/${collectionIds.join("/")}`);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
ul {
	display: flex;
	flex-direction: row;
	padding: 1rem 2rem;
	margin: 0;

	font-size: 1.3rem;
	line-height: 1.3;
	min-height: 3.7rem;

	overflow-x: auto;
}

li {
	display: inline-block;

	flex-grow: 0;
	flex-shrink: 0;

	padding: 0;
	margin: 0;
}

li > a {
	text-decoration: none;

	display: inline-block;
	vertical-align: middle;

	overflow: hidden;
	white-space: pre;
}

li > a:focus,
li > a:active,
li > a:hover {
	text-decoration: underline;
}

li:not(:last-child)::after {
	content: "";
	display: inline-block;
	margin: 0 1.5ch;
	vertical-align: middle;

	/** Creates triangle by exploiting how borders are drawn */
	width: 0px;
	height: 0px;
	border-top: 0.35em solid transparent;
	border-bottom: 0.35em solid transparent;
	border-left: 0.5em solid;
}

ul.edit-link-on li:nth-last-child(2)::after {
	content: none;
}

li:last-child {
	padding-right: 1rem;
}

.resource-path-breadcrumbs {
	display: flex;
}

.edit-link {
	font-size: 0.65em;
	margin-left: 1rem;
}

.edit-link a {
	text-decoration: none;
	padding: 0.3rem 0.6rem;
	margin-top: 0.15rem;
}

/* Mobile and Tablet Styles */

.viewport-mobile ul {
	font-size: 1rem;
	min-height: 3.2rem;
	padding-top: 0.7rem;
	padding-bottom: 0.7rem;
}

.viewport-mobile ul,
.viewport-tablet ul {
	padding: 1rem;
}
</style>
