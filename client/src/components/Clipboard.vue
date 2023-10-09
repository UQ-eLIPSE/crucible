<template>
	<div
		class="clipboard"
		v-if="
			clipboardItemExists || operationFeedbackMessage.message.length > 0
		"
	>
		<h1>Clipboard</h1>

		<div
			class="row"
			v-if="clipboardItemExists"
		>
			<div v-if="multipleItems !== undefined">
				<div
					class="item"
					v-for="(label, i) in allItemLabels"
					:key="i"
				>
					<div class="file">{{ label }}</div>
					<div class="operation">
						<b>{{ itemText }} </b>
					</div>
				</div>
			</div>

			<div
				class="item"
				v-else
			>
				<div class="file">{{ itemLabel }}</div>
				<div class="operation">
					<b>{{ itemText }} </b>
				</div>
			</div>

			<div class="controls">
				<button
					type="button"
					class="button small"
					@click.prevent="pasteClipboardItem"
				>
					Paste
				</button>
				<button
					type="button"
					class="button small secondary"
					@click.prevent="clearClipboardItem"
				>
					Clear
				</button>
			</div>
		</div>

		<div
			class="row inline-message-box"
			:class="getMessageClass(operationFeedbackMessage)"
			v-if="operationFeedbackMessage.message.length > 0"
		>
			<span>{{ operationFeedbackMessage.message }}</span>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Api from "../api";
import { IResource_FromServer, Type as ResourceType } from "@/types/Resource";
import type { StatusMessage } from "@/types/SuccessMessage";
import type { Clipboard } from "../store/state";

/**
 * TODO Refactoring this component
 *  Remove multipleItems property in Clipboard and merge it with items
 *  This involves changing Clipboard interface in /store/state
 *  Combining CopyItem and CopyAllItems in /store/clipboard
 *  Combining CutItem and CutAllItems in /store/clipboard
 *  Combining all checks for multipleItems in this file
 */
export default defineComponent({
	name: "ClipBoard",
	props: {
		activeChildItem: {
			type: Object as PropType<IResource_FromServer>,
			required: false,
		},
		activeCollection: {
			type: Object as PropType<IResource_FromServer>,
			required: false,
		},
	},
	emits: ["success", "updated"],
	data() {
		return {
			/** Stores success / error messages */
			statusMessage: {
				message: "",
				type: "",
			} as StatusMessage,
		};
	},
	computed: {
		clipboard(): Clipboard {
			return this.clipboardItemExists
				? this.$store.getters.clipboard
				: {};
		},

		clipboardItemExists() {
			return this.$store.getters.clipboardItemExists as boolean;
		},

		multipleItems() {
			return this.clipboard.multipleItems;
		},

		itemLabel() {
			if (!this.clipboard.item) return;
			return this.clipboard.item.label;
		},

		allItemLabels() {
			if (!this.clipboard.multipleItems) return;
			return this.clipboard.multipleItems.map(
				(item: IResource_FromServer) => item.label
			);
		},

		itemText() {
			return this.checkOperation("copy")
				? "Copied"
				: this.checkOperation("cut")
				? "Cut"
				: "";
		},
		operationFeedbackMessage: {
			get() {
				return this.statusMessage;
			},
			set(feedbackObject: { message: string; type: string }) {
				this.statusMessage = feedbackObject;
			},
		},
	},
	methods: {
		checkOperation(operation: "cut" | "copy" | "unset") {
			switch (operation) {
				case "cut":
					return this.clipboard.operation === "cut";
				case "copy":
					return this.clipboard.operation === "copy";
				default:
					return this.clipboard.operation === "unset";
			}
		},
		hideMessageWithDelay() {
			setTimeout(() => {
				this.operationFeedbackMessage = { message: "", type: "" };
			}, 1200);
		},
		getMessageClass(feedbackObject: StatusMessage) {
			return {
				negative: feedbackObject.type === "error",
				positive: feedbackObject.type === "success",
			};
		},
		clearClipboardItem() {
			this.$store.commit("CLEAR_CLIPBOARD");
			this.hideMessageWithDelay();
		},
		/**
		 * Displays success message and emits a success event to parent.
		 * Emitting event helps the parent (ResourceManager) to detect the successful operation and reload data.
		 */
		successfulCopyOperation() {
			this.operationFeedbackMessage = {
				message: "Success!",
				type: "success",
			};
			this.$emit("success");
			this.hideMessageWithDelay();
		},
		isValidCollection(
			parentCollection: IResource_FromServer | undefined
		): boolean {
			return Boolean(
				parentCollection &&
					(parentCollection.type ===
						ResourceType.RESOURCE_COLLECTION_TOPIC_BUNDLE ||
						parentCollection.type ===
							ResourceType.RESOURCE_COLLECTION_ROOT ||
						parentCollection.type ===
							ResourceType.RESOURCE_COLLECTION)
			);
		},
		/**
		 * Includes common functionality for copy and cut operations:
		 * Creates copy of resource, saves resource and patches active collection with newly created child resource.
		 */
		pasteClipboardItem() {
			if (this.isValidCollection(this.activeCollection)) {
				const newActiveCollection = this
					.activeCollection as IResource_FromServer;
				if (this.multipleItems) {
					// TODO convert for loop to map
					for (const item of this.multipleItems) {
						const resourceFormData =
							this.getNewResourceFormData(item);
						this.saveResource(resourceFormData).then((res: any) => {
							const newResource: IResource_FromServer = res.data;

							// add new object's id to active collection's children
							newActiveCollection.content.children.push(
								newResource._id
							);

							// patch parent
							this.patchParent(newActiveCollection).then(() => {
								// Copied successfully
								if (this.checkOperation("copy"))
									this.successfulCopyOperation();

								// If cut operation was chosen, perform cut specific operations
								if (this.checkOperation("cut"))
									this.cutOperation();
							});
						});
					}
				} else {
					const resourceFormData = this.getNewResourceFormData();
					this.saveResource(resourceFormData).then((res: any) => {
						const newResource: IResource_FromServer = res.data;

						// add new object's id to active collection's children
						newActiveCollection.content.children.push(
							newResource._id
						);

						// patch parent
						this.patchParent(newActiveCollection).then(() => {
							// Copied successfully
							if (this.checkOperation("copy"))
								this.successfulCopyOperation();

							// If cut operation was chosen, perform cut specific operations
							if (this.checkOperation("cut")) this.cutOperation();
						});
					});
				}
				this.$emit("updated", newActiveCollection);
			}
		},
		cutOperation() {
			this.deleteResource(
				this.clipboard.item as IResource_FromServer
			).then(() => {
				//  show success message for cut operation
				this.operationFeedbackMessage = {
					message: "Success!",
					type: "success",
				};
				// Clear clipboard since cut-paste operation can only be performed once
				this.clearClipboardItem();
				this.$emit("success");
				this.hideMessageWithDelay();
			});
		},
		/** Copies resource and creates FormData */
		getNewResourceFormData(item?: IResource_FromServer) {
			// id is excluded from new object copy
			const { _id, ...newObject } = item
				? item
				: (this.clipboard.item as IResource_FromServer);
			const formData = new FormData();
			formData.append("resource", JSON.stringify(newObject));
			return formData;
		},
		async deleteResource(item: IResource_FromServer) {
			try {
				return await Api.Resource.remove(item._id);
			} catch (e) {
				this.operationFeedbackMessage = {
					message: "An error was encountered. Please try again.",
					type: "error",
				};
				throw e;
			}
		},
		async saveResource(formData: FormData) {
			try {
				return await Api.Resource.insert(formData);
			} catch (e) {
				this.operationFeedbackMessage = {
					message: "An error was encountered. Please try again.",
					type: "error",
				};
				throw e;
			}
		},
		async patchParent(parent: IResource_FromServer) {
			try {
				return await Api.Resource.updateById(parent._id, parent);
			} catch (e) {
				this.operationFeedbackMessage = {
					message: "An error was encountered. Please try again.",
					type: "error",
				};
				throw e;
			}
		},
	},
});
</script>

<style scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";

.clipboard {
	display: flex;
	flex-direction: column;
	border-bottom: 0.25em ridge rgba(0, 0, 0, 0.2);
	padding: 1rem 2rem;
	background-color: #f7f2f9;
}

.viewport-tablet .clipboard {
	padding: 1rem;
}

.controls {
	align-self: center;
}

.item {
	display: flex;
	margin: 0.5rem 0;
	align-items: center;
	align-content: center;
	outline: 0.2rem solid rgba(0, 0, 0, 0.1);
	border-radius: 0.2rem;
}

.item > .operation {
	padding: 0.5rem 1rem;
	background-color: rgba(0, 0, 0, 0.7);
	color: #fff;
}

.item > .file {
	color: white;
	padding: 0.5rem 1rem;
	background-color: #49075e;
}

.row {
	display: flex;
	justify-content: space-between;
}

.inline-message-box {
	margin-top: 0.2rem;
}

h1 {
	font-size: 2em;
	margin: 0.2rem 0;
}
</style>
