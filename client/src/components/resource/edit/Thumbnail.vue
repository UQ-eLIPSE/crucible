<template>
	<div class="resource-edit-thumbnail">
		<div
			v-if="isEdit && oldThumbnailInfo"
			class="old-thumbnail"
		>
			<p>Current thumbnail</p>
			<img
				:src="oldThumbnailInfo"
				width="200px"
			/>
			<p class="minimal">Hosted at</p>

			<!-- Input is readonly, text gets selected on click -->
			<input
				:value="oldThumbnailInfo"
				@click="selectField($event)"
				readonly
			/>
		</div>

		<div>
			<a
				class="no-text-decoration"
				v-if="isEdit"
				href="#"
				@click.prevent="changeThumbnailToggle"
			>
				<div class="accordion info">
					<span>Change Thumbnail</span>
					<span
						class="arrow"
						:class="arrowClasses"
					></span>
				</div>
			</a>
			<p v-else>Thumbnail</p>
			<div v-show="(isEdit && displayChangeThumbnailFields) || !isEdit">
				<div class="thumbnail-info">
					<strong>Note:</strong> Optimal image aspect ratio for
					thumbnails is <strong>16:9</strong>. Images with other
					aspect ratios will be zoomed in/out to fit container.
				</div>
				<div
					v-if="thumbnailMessage"
					class="inline-message-box"
					:class="thumbnailMessageClasses"
				>
					{{ thumbnailMessageOutput }}
				</div>

				<select v-model="thumbnailType" cy-data="thumbnail-select">
					<option
						disabled
						value=""
						selected
					>
						Please select one
					</option>
					<option :value="thumbnailTypes.NO_THUMBNAIL">
						No thumbnail
					</option>
					<option :value="thumbnailTypes.URL">Link</option>
					<option :value="thumbnailTypes.IMAGE">Upload image</option>
					<option
						v-if="isVideoResource"
						:value="thumbnailTypes.VIDEO_FRAME"
					>
						Snapshot from video
					</option>
				</select>

				<div
					class="option"
					v-if="isUrl"
				>
					<input
						v-model="thumbnailUrl"
						placeholder="Enter thumbnail link"
						type="text"
					/>
				</div>

				<div
					class="option"
					v-if="isImage"
				>
					<FileSelector
						v-model:files="thumbnailFile"
						:mimeType="'image/*'"
						:multiple="false"
						:smallButton="true"
						:buttonLabel="'Select a thumbnail image'"
					></FileSelector>
				</div>

				<!-- If video frame capture option is chosen -->
				<div
					class="option"
					v-if="isVideoFrameCapture"
				>
					<div
						class="option video-container"
						:class="videoContainerClasses"
					>
						<div
							v-if="videoSourceForThumbnail"
							class="message info"
						>
							Use the below video's seek bar to find a video frame
							which you want as the thumbnail. Pause the video at
							this frame.
						</div>

						<video
							ref="video"
							v-if="videoSourceForThumbnail"
							:src="videoSourceForThumbnail"
							controls
							@timeupdate="changeVideoThumbnailTime"
							width="100%"
						></video>

						<div
							class="message info"
							v-if="videoSourceForThumbnail"
						>
							Video snapshot will be captured at time
							<strong>{{ videoTimeInHMS }}</strong> upon save.
						</div>
						<div
							v-if="!videoSourceForThumbnail"
							class="message warning"
						>
							<span
								>The desired resource video file is required
								before a thumbnail can be selected</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { SuccessMessage } from "@/types/SuccessMessage";
import FileSelector from "@/components/FileSelector.vue";
import {
	IResource_Base,
	IResource_FromServer,
	Type as ResourceType,
} from "@/types/Resource";
import { defineComponent, PropType } from "vue";

const THUMBNAIL_TYPES = {
	URL: "URL",
	IMAGE: "IMAGE",
	VIDEO_FRAME: "VIDEO_FRAME",
	NO_THUMBNAIL: "NO_THUMBNAIL",
};
export default defineComponent({
	name: "ResourceThumbnail",
	components: {
		FileSelector,
	},
	props: {
		resource: {
			type: Object as PropType<IResource_FromServer | IResource_Base>,
			required: true,
		},
		/** Indicates if this component is in "edit mode" or not */
		isEdit: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["thumbnailChanged"],
	data() {
		return {
			/** Stores thumbnail */
			// Defaults to URL thumbnail
			thumbnail: this.getThumbnailUrlStructure() as any,

			/** Stores success/failure message after validation  */
			thumbnailMessage: undefined as SuccessMessage | undefined,

			/** Tracks thumbnail option */
			// Defaults to URL thumbnail
			thumbnailOption: THUMBNAIL_TYPES.URL as string,

			/** Mime type for images for validating upload file type */
			mimeType: "image/*",

			// TODO: Support for thumbnails not yet present (any)
			oldThumbnail: undefined as any | undefined,

			/** Stores object URL created when a video file is changed / selected */
			videoFileObjectUrl: undefined as String | undefined,

			displayChangeThumbnail: false,
		};
	},
	created() {
		this.oldThumbnail = this.resource.thumbnail;

		// Check if video file exists on creation
		if (this.resourceVideoFile) {
			this.videoFile = window.URL.createObjectURL(this.resourceVideoFile);
		}
	},
	watch: {
		/** Update properties if resource changes (e.g. after resource is saved) */
		resource: {
			handler() {
				this.displayChangeThumbnailFields = false;
				this.oldThumbnail = this.resource.thumbnail;
				/** Commented out the lines below as it is preventing the user from
				being able to change the Thumbnail dropdown and input a link
				Kept for when this file is refactored incase we do need the lines
				*/
				//this.thumbnail = this.getThumbnailUrlStructure();
				//this.thumbnailType = THUMBNAIL_TYPES.URL;
			},
		},

		/**
		 * This watcher detects if a file was selected / changed in resource.content
		 * Creates object URL and updates the video src
		 */
		resourceVideoFile: {
			handler() {
				if (this.resourceVideoFile) {
					this.videoFile = window.URL.createObjectURL(
						this.resourceVideoFile
					);
				}
			},
		},
	},
	computed: {
		videoSourceForThumbnail() {
			if (this.isEdit) {
				// Edit mode
				return this.resource.content.url;
			} else {
				// creation mode
				return this.videoFile || "";
			}
		},

		arrowClasses() {
			return {
				"arrow-up": this.displayChangeThumbnailFields,
			};
		},

		displayChangeThumbnailFields: {
			get() {
				return this.displayChangeThumbnail;
			},
			set(option: boolean) {
				this.displayChangeThumbnail = option;
			},
		},
		/**
		 * Converts seconds to hh:mm:ss.
		 * Note: Works only if video duration does not exceed 24 hours (which is a fair assumption for an uploaded video's maximum duration)
		 */
		videoTimeInHMS() {
			return new Date(this.thumbnail.timeToTakeFrame * 1000)
				.toISOString()
				.substr(11, 8);
		},

		videoFile: {
			get() {
				return this.videoFileObjectUrl;
			},
			set(url: string) {
				this.videoFileObjectUrl = url;
			},
		},

		isVideoResource() {
			return this.resource.type === ResourceType.VIDEO_INTERNAL;
		},

		resourceVideoFile() {
			return this.resource.content.file || undefined;
		},

		videoContainerClasses() {
			return {
				"video-container-editor": this.isEdit,
			};
		},

		/** Checks whether user has selected image upload */
		isImage() {
			return this.thumbnailType === this.thumbnailTypes.IMAGE;
		},

		isVideoFrameCapture() {
			return this.thumbnailType === this.thumbnailTypes.VIDEO_FRAME;
		},

		/** Checks whether user has selected url(Link) */
		isUrl() {
			return this.thumbnailType === this.thumbnailTypes.URL;
		},

		thumbnailTypes() {
			return THUMBNAIL_TYPES;
		},

		thumbnailType: {
			get() {
				return this.thumbnailOption;
			},
			set(type: string) {
				if (type === this.thumbnailOption) {
					//Do nothing if type was not changed
					return;
				}

				if (type === this.thumbnailTypes.NO_THUMBNAIL) {
					this.thumbnail = null;
				} else if (type === this.thumbnailTypes.VIDEO_FRAME) {
					this.thumbnail = this.getThumbnailVideoFrameStructure();
				} else if (type === this.thumbnailTypes.IMAGE) {
					this.thumbnail = this.getThumbnailFileStructure();
				} else if (type === this.thumbnailTypes.URL) {
					this.thumbnail = this.getThumbnailUrlStructure();
				}

				this.thumbnailOption = type;
				this.$emit("thumbnailChanged", this.thumbnail);
			},
		},

		oldThumbnailInfo() {
			if (this.oldThumbnail) {
				return this.oldThumbnail.url;
			}
			return undefined;
		},

		/** Gets image file chosen by user */
		thumbnailFile: {
			get() {
				// We need to return an array rather than a File object because
				// FileSelector always uses an array for its input, regardless of
				// whether it has "multiple" on or not
				if (this.thumbnail) {
					if (this.thumbnail.file === undefined) {
						return [];
					}

					return [this.thumbnail.file];
				}
				return [];
			},
			set(files: File[]) {
				if (files.length > 0) {
					if (this.isImage) {
						this.thumbnail.file = files[0];

						this.$emit("thumbnailChanged", this.thumbnail);
					}
				}
			},
		},

		/** Manages styling for this component */
		thumbnailMessageClasses() {
			const classes: string[] = [];

			if (this.thumbnailMessage !== undefined) {
				classes.push(
					this.thumbnailMessage.success ? "positive" : "negative"
				);
			}

			return classes;
		},

		thumbnailMessageOutput() {
			return (
				this.thumbnailMessage &&
				this.thumbnailMessage.messages &&
				this.thumbnailMessage.messages.join("; ")
			);
		},

		thumbnailUrl: {
			get() {
				return this.thumbnail.url || "";
			},
			/** If thumbnail.url is set in DOM, emits "thumbnailChanged" event to parent */
			set(newUrl: string) {
				if (this.isUrl) {
					this.thumbnail.url = newUrl;
					if (newUrl.trim().length > 0) {
						this.$emit("thumbnailChanged", this.thumbnail);
					}
				}
			},
		},
	},
	methods: {
		changeThumbnailToggle() {
			this.displayChangeThumbnailFields =
				!this.displayChangeThumbnailFields;
		},

		changeVideoThumbnailTime() {
			this.thumbnail.timeToTakeFrame = (
				this.$refs.video as HTMLVideoElement
			).currentTime;
		},

		/** Resets thumbnail message */
		clearThumbnailMessage() {
			this.thumbnailMessage = undefined;
		},

		setThumbnailMessage(success: boolean, messages: string[]) {
			return (this.thumbnailMessage = {
				success,
				messages,
			});
		},

		/** Validates component details on submission. Invoked by parent component during its validation */
		validate() {
			if (this.isImage && this.thumbnail.file) {
				if (!this.isValidImageFile(this.thumbnail.file.type)) {
					return this.setThumbnailMessage(false, [
						"Please select a valid image file",
					]);
				}
			}
			this.clearThumbnailMessage();

			// Successful validation
			const message: SuccessMessage = {
				success: true,
			};
			return message;
		},

		/** Returns structure of thumbnail object with URL */
		getThumbnailUrlStructure() {
			return {
				url: undefined,
				size: "cover",
			};
		},

		/** Returns structure of thumbnail object with file */
		getThumbnailFileStructure() {
			return {
				file: undefined,
			};
		},

		/** Returns structure of thumbnail object with a timeToTakeFrame property */
		getThumbnailVideoFrameStructure() {
			return {
				timeToTakeFrame: 0,
			};
		},

		/** Checks whether a valid video file has been chosen */
		isValidImageFile(fileType: string) {
			return fileType.split("/")[0] === this.mimeType.split("/")[0];
		},

		/** Selects the contents of the input field */
		selectField(e: MouseEvent) {
			(e.currentTarget as HTMLInputElement).select();
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";

p {
	margin: 0.2rem;
	font-weight: bold;
}

.minimal {
	font-weight: normal;
}

.option {
	padding-top: 1rem;
}

.old-thumbnail {
	width: 100%;
}

.message {
	border: 1px solid transparent;
	border-radius: 0.2rem;
	text-align: center;
	padding: 1rem;
}

.message.warning {
	background-color: #fcf8e3;
	border-color: #faf2cc;
	color: #8a6d3b;
}

.video-container {
	width: 40%;
}

.video-container-editor {
	width: 80%;
}

.no-text-decoration {
	text-decoration: none;
}

.accordion {
	display: flex;
	justify-content: space-between;
	padding: 0.8rem;
	border-radius: 0.2rem;
	margin-top: 0.4rem;
	margin-bottom: 0.8rem;
}

.info {
	color: #31708f;
	background-color: #d9edf7;
	border-color: #bce8f1;
}

.thumbnail-info {
	padding: 0.2rem;
	border-radius: 0.2rem;
	margin: 0.2rem 0;
	font-size: 0.8em;
	font-style: italic;
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

/* Makes readonly inputs look like disabled */

input[readonly] {
	border-color: darkgrey;
	border-style: solid;
	border-width: 1px;
	background-color: rgb(235, 235, 228);
	color: rgb(84, 84, 84);
}
</style>
