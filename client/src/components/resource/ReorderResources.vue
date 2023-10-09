<template>
	<div class="reorder-resources">
		<h2>Reorder resources</h2>
		<div class="info">
			<strong>Note:</strong> Please <strong>save</strong> resource after
			reordering is complete
		</div>

		<!-- Only inline documents -->
		<a
			class="info border-blue no-text-decoration"
			v-if="modifiedChildInlineList.length > 0"
			href="#"
			@click.prevent="toggleInlineList"
		>
			<div class="accordion">
				<strong>Reorder inline documents</strong>
				<span
					class="arrow"
					:class="inlineArrowClasses"
				></span>
			</div>
		</a>

		<transition name="fade">
			<div v-if="displayInlineList">
				<div
					class="controls"
					v-if="modifiedChildInlineList.length > 0"
				>
					<div>
						<span>From</span>
						<input
							type="number"
							v-model="fromInputInlineDocuments"
							min="1"
							:max="modifiedChildInlineList.length"
							placeholder="#From"
						/>
						<span>To</span>
						<input
							type="number"
							v-model="toInputInlineDocuments"
							min="1"
							:max="modifiedChildInlineList.length"
							placeholder="#To"
						/>
						<button
							type="button"
							class="button small"
							@click.prevent="reorderInline"
						>
							Quick reorder
						</button>
					</div>
					<div>
						<button
							type="button"
							class="button small"
							@click.prevent="resetInline"
						>
							Reset
						</button>
					</div>
				</div>

				<transition-group
					class="child-list"
					name="flip-list"
					tag="ul"
					v-if="modifiedChildInlineList.length > 0"
				>
					<li
						v-for="(child, index) in modifiedChildInlineList"
						:key="child._id"
						class="list-item"
						:class="listItemClasses(child)"
					>
						<div class="data-wrap">
							<div class="arrows">
								<button
									v-if="index > 0"
									class="button secondary small"
									@click.prevent="
										moveUpInlineDocuments(index)
									"
								>
									&#8679;
								</button>
								<button
									v-if="
										index <
										modifiedChildInlineList.length - 1
									"
									class="button secondary small"
									@click.prevent="
										moveDownInlineDocuments(index)
									"
								>
									&#8681;
								</button>
							</div>
							<div class="props">
								<h1>#{{ index + 1 }}</h1>
								<h3>{{ child.label }}</h3>
								<p v-if="child.tags && child.tags.length > 0">
									Tags: {{ child.tags.join(", ") }}
								</p>
							</div>
						</div>
						<div
							class="background"
							:class="backgroundClasses(child)"
							:style="backgroundStyles(child)"
						></div>
					</li>
				</transition-group>
			</div>
		</transition>

		<!-- Other resources -->
		<a
			class="info border-blue no-text-decoration"
			v-if="modifiedChildList.length > 0"
			href="#"
			@click.prevent="toggleResourceList"
		>
			<div class="accordion">
				<strong>Reorder resources</strong>
				<span
					class="arrow"
					:class="resourceArrowClasses"
				></span>
			</div>
		</a>

		<transition name="fade">
			<div v-if="displayResourceList">
				<div
					class="controls"
					v-if="modifiedChildList.length > 0"
				>
					<div>
						<span>From</span>
						<input
							type="number"
							v-model="fromInput"
							min="1"
							:max="modifiedChildList.length"
							placeholder="#From"
						/>
						<span>To</span>
						<input
							type="number"
							v-model="toInput"
							min="1"
							:max="modifiedChildList.length"
							placeholder="#To"
						/>
						<button
							type="button"
							class="button small"
							@click.prevent="reorder"
						>
							Quick reorder
						</button>
					</div>
					<div>
						<button
							type="button"
							class="button small"
							@click.prevent="resetResources"
						>
							Reset
						</button>
					</div>
				</div>

				<transition-group
					class="child-list"
					name="flip-list"
					tag="ul"
				>
					<li
						v-for="(child, index) in modifiedChildList"
						:key="child._id"
						class="list-item"
						:class="listItemClasses(child)"
					>
						<div class="data-wrap">
							<div class="arrows">
								<button
									v-if="index > 0"
									class="button secondary small"
									@click.prevent="moveUp(index)"
								>
									&#8679;
								</button>
								<button
									v-if="index < modifiedChildList.length - 1"
									class="button secondary small"
									@click.prevent="moveDown(index)"
								>
									&#8681;
								</button>
							</div>
							<div class="props">
								<h1>#{{ index + 1 }}</h1>
								<h3>{{ child.label }}</h3>
								<p v-if="child.tags && child.tags.length > 0">
									Tags: {{ child.tags.join(", ") }}
								</p>
							</div>
						</div>
						<div
							class="background"
							:class="backgroundClasses(child)"
							:style="backgroundStyles(child)"
						></div>
					</li>
				</transition-group>
			</div>
		</transition>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { IResource_FromServer } from "@/types/Resource";
import { defineComponent, PropType } from "vue";
import { Type as ResourceType } from "@/types/Resource";

export default defineComponent({
	name: "ReorderResources",
	props: {
		/** Child resources */
		children: {
			type: Array as PropType<IResource_FromServer[]>,
			required: true,
		},
	},
	emits: ["reordered"],
	data() {
		return {
			/** Keeps track of modified children items */
			modifiedChildren: [] as IResource_FromServer[],
			modifiedChildrenInlineDocuments: [] as IResource_FromServer[],
			fromInput: "",
			toInput: "",
			fromInputInlineDocuments: "",
			toInputInlineDocuments: "",
			showInlineList: false,
			showResourceList: false,
		};
	},
	created() {
		const modifiedList = this.children;
		this.modifiedChildList = modifiedList.filter(
			(resource: IResource_FromServer) =>
				resource.type !==
				ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
		);
		this.modifiedChildInlineList = modifiedList.filter(
			(resource: IResource_FromServer) =>
				resource.type ===
				ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
		);
	},
	computed: {
		/** Functionality */
		modifiedChildInlineList: {
			get(): IResource_FromServer[] {
				return this.modifiedChildrenInlineDocuments;
			},
			set(list: IResource_FromServer[]) {
				this.modifiedChildrenInlineDocuments = [...list];
			},
		},
		modifiedChildList: {
			get(): IResource_FromServer[] {
				return this.modifiedChildren;
			},
			set(list: IResource_FromServer[]) {
				this.modifiedChildren = [...list];
			},
		},
		/** Style controls */
		displayInlineList: {
			get() {
				return this.showInlineList;
			},
			set(x: boolean) {
				this.showInlineList = x;
			},
		},
		displayResourceList: {
			get() {
				return this.showResourceList;
			},
			set(x: boolean) {
				this.showResourceList = x;
			},
		},
		inlineArrowClasses() {
			return {
				"arrow-up": this.displayInlineList,
			};
		},
		resourceArrowClasses() {
			return {
				"arrow-up": this.displayResourceList,
			};
		},
	},
	watch: {
		/** Watches children prop for any changes and updates the child lists */
		children() {
			this.modifiedChildList = this.children.filter(
				(resource: IResource_FromServer) =>
					resource.type !==
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
			this.modifiedChildInlineList = this.children.filter(
				(resource: IResource_FromServer) =>
					resource.type ===
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
		},
	},
	methods: {
		/** Emits reorder event to parent */
		saveReorder() {
			this.$emit("reordered", [
				...this.modifiedChildInlineList,
				...this.modifiedChildList,
			]);
		},

		/** Resets order to the original (unmodified) order */
		resetResources() {
			this.modifiedChildList = this.children.filter(
				(resource: IResource_FromServer) =>
					resource.type !==
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
			this.saveReorder();
		},

		resetInline() {
			this.modifiedChildInlineList = this.children.filter(
				(resource: IResource_FromServer) =>
					resource.type ===
					ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
			);
			this.saveReorder();
		},

		reorderInline() {
			if (!this.fromInputInlineDocuments || !this.toInputInlineDocuments)
				return;

			const fromIndex = parseInt(this.fromInputInlineDocuments) - 1;
			const toIndex = parseInt(this.toInputInlineDocuments) - 1;

			if (fromIndex === toIndex) return;
			if (fromIndex < 0 || toIndex >= this.modifiedChildInlineList.length)
				return;

			const removed = this.modifiedChildInlineList.splice(
				fromIndex,
				1
			)[0];
			this.modifiedChildInlineList.splice(toIndex, 0, removed);
			this.saveReorder();
		},

		reorder() {
			if (!this.fromInput || !this.toInput) return;

			const fromIndex = parseInt(this.fromInput) - 1;
			const toIndex = parseInt(this.toInput) - 1;

			if (fromIndex === toIndex) return;
			if (fromIndex < 0 || toIndex >= this.modifiedChildList.length)
				return;

			const removed = this.modifiedChildList.splice(fromIndex, 1)[0];
			this.modifiedChildList.splice(toIndex, 0, removed);
			this.saveReorder();
		},

		moveUpInlineDocuments(index: number) {
			const removed = this.modifiedChildInlineList.splice(index, 1)[0];
			this.modifiedChildInlineList.splice(index - 1, 0, removed);
			this.saveReorder();
		},

		moveDownInlineDocuments(index: number) {
			const removed = this.modifiedChildInlineList.splice(index, 1)[0];
			this.modifiedChildInlineList.splice(index + 1, 0, removed);
			this.saveReorder();
		},

		moveUp(index: number) {
			const removed = this.modifiedChildList.splice(index, 1)[0];
			this.modifiedChildList.splice(index - 1, 0, removed);
			this.saveReorder();
		},

		moveDown(index: number) {
			const removed = this.modifiedChildList.splice(index, 1)[0];
			this.modifiedChildList.splice(index + 1, 0, removed);
			this.saveReorder();
		},
		backgroundClasses(resource: any) {
			return {
				"background-image-defined": !!resource.thumbnail,
			};
		},

		toggleResourceList() {
			this.displayResourceList = !this.displayResourceList;
		},

		toggleInlineList() {
			this.displayInlineList = !this.displayInlineList;
		},

		backgroundStyles(child: any) {
			const styles: { [prop: string]: string } = {};
			if (child.thumbnail && child.thumbnail.url) {
				styles.backgroundImage = `url(${child.thumbnail.url})`;
				styles.backgroundSize = child.thumbnail.size || "cover";
			}
			return styles;
		},

		listItemClasses(child: any) {
			return {
				"thumbnail-enabled": !!child.thumbnail,
			};
		},
	},
});
</script>

<!-- ####################################################################### -->
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";

.reorder-resources {
	display: flex;
	flex-direction: column;
}

.controls {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.child-list {
	list-style-type: none;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.list-item {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	overflow: hidden;
	margin: 1rem 0 1rem;
	border: 1px solid #c5c5c5;
	background-color: #49075e;
	color: white;
	box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
	border-radius: 0.2rem;
	outline: 0.2rem solid rgba(0, 0, 0, 0.1);
	position: relative;
}

.list-item.thumbnail-enabled {
	padding-right: 9.5rem;
}

.props {
	display: flex;
	flex-direction: column;
}

.props h1,
.props h2,
.props h3,
.props p {
	margin: 0;
	color: white;
}

.props h1 {
	font-weight: lighter;
}

.arrows {
	display: flex;
	flex-direction: column;
	font-size: 1.5em;
	padding-right: 1rem;
	justify-content: space-around;
}

input {
	width: 7rem;
}

.controls span {
	font-weight: bold;
}

.data-wrap {
	display: flex;
	/* flex-wrap: wrap; */
	padding: 1rem;
}

.background {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;

	background-repeat: no-repeat;
	background-size: cover;
	background-position: center center;
	transition: background-color 200ms linear;
}

.background-image-defined {
	width: 9rem;
}

.border-blue {
	border: 0.2em solid #2a6582;
}

.info {
	padding: 0.8rem;
	border-radius: 0.2rem;
	margin-top: 0.4rem;
	margin-bottom: 0.8rem;
	color: #31708f;
	background-color: #d9edf7;
	border-color: #bce8f1;
}

.accordion {
	display: flex;
	justify-content: space-between;
}

.row {
	display: flex;
}

.arrow {
	cursor: pointer;
	background: none;
	padding: 0;
	border-style: none;
	align-self: center;
	border-left: 0.4rem solid transparent;
	border-right: 0.4rem solid transparent;
	border-top: 0.8rem solid black;
	width: 0;
	height: 0;
	margin-left: 0.5rem;
	transition: all 200ms;
}

.arrow-up {
	-webkit-transform: rotate(180deg);
	-moz-transform: rotate(180deg);
	-o-transform: rotate(180deg);
	-ms-transform: rotate(180deg);
	transform: rotate(180deg);
}

.no-text-decoration {
	text-decoration: none;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 250ms;
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
	transform: translateY(-5px);
}

/** Used by Vue's <transition-group>  internally */

.flip-list-move {
	transition: transform 1s;
}
</style>
