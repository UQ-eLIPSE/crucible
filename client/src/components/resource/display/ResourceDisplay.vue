<template>
	<div class="resource-display">
		<!-- When item is available -->
		<template v-if="item">
			<ul class="controls">
				<li class="title">
					<h2>{{ item.label }}</h2>
				</li>
				<li
					v-if="showCloseButton"
					class="close"
				>
					<a
						href="#"
						@click.prevent="triggerClose"
						>Close</a
					>
				</li>
			</ul>
			<component
				class="display-component"
				:is="displayComponent"
				:item="item"
				:autoplay="autoplay"
				:isEditPreviewMode="isEditPreviewMode"
			></component>
		</template>

		<!-- When item is not available -->
		<div
			class="hint-text"
			v-else
		>
			<span>Select a resource to view</span>
		</div>
	</div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Type as ResourceType, IResource_FromServer } from "@/types/Resource";

import Null from "./Null.vue";
import QuizUq from "./quiz/QuizUq.vue";
import VideoInternal from "./VideoInternal.vue";
import DocumentInternal from "./DocumentInternal.vue";
import DocumentExternal from "./DocumentExternal.vue";
import ServiceExternalLti from "./ServiceExternalLti.vue";
import VideoExternalKaltura from "./VideoExternalKaltura.vue";
import AuthorisationRequest from "./AuthorisationRequest.vue";
import SmartQuizQuestion from "./quiz/SmartQuizQuestion.vue";

// @ts-ignore Ignore types for Prism
import * as Prism from "@/assets/prism/prism.js";
import { defineComponent, PropType } from "vue";

export default defineComponent({
	name: "ResourceDisplay",
	props: {
		isSmartQuiz: {
			type: Boolean,
			required: false,
		},
		item: {
			type: Object as PropType<IResource_FromServer>,
			required: false,
		},
		showCloseButton: {
			type: Boolean,
			required: false,
			default: true,
		},
		autoplay: {
			type: Boolean,
			required: false,
			default: true,
		},
		/** Indicates if the display is for previewing during edits */
		isEditPreviewMode: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	emits: ["close"],
	created() {
		this.setupCodeHighlighting();
	},
	watch: {
		item() {
			this.setupCodeHighlighting();
		},
	},
	computed: {
		displayComponent() {
			// If the resource is locked, we need to instead ask for authorisation
			// This should not apply for edit preview mode
			if (
				!this.isEditPreviewMode &&
				this.item &&
				this.item.permissions &&
				this.item.permissions._currentlyLocked
			) {
				return AuthorisationRequest;
			}
			switch (this.item?.type) {
				case ResourceType.DOCUMENT_INTERNAL:
					return DocumentInternal;
				case ResourceType.DOCUMENT_EXTERNAL:
					return DocumentExternal;
				case ResourceType.VIDEO_INTERNAL:
					return VideoInternal;
				case ResourceType.VIDEO_EXTERNAL_KALTURA:
					return VideoExternalKaltura;
				case ResourceType.QUIZ_UQ_CHEM:
					return QuizUq;
				case ResourceType.QUIZ_QUESTION:
					return SmartQuizQuestion;
				case ResourceType.SERVICE_EXTERNAL_LTI:
					return ServiceExternalLti;
				case ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL:
					return DocumentInternal;
			}
			// TODO: Build an "error" display component
			return Null;
		},
	},
	methods: {
		triggerClose() {
			this.$emit("close");
		},

		setupCodeHighlighting() {
			setTimeout(() => Prism.Prism.highlightAll(), 0);
		},
	},
});
</script>

<!-- ####################################################################### -->

<style lang="scss" scoped>
.resource-display {
	background: rgba(189, 161, 78, 0.2);
	overflow-y: auto;
	height: 85vh;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	/* Disabling justify-content for now, causing content to overflow incorrectly*/
	/* justify-content: center; */
}

.display-component {
	flex-grow: 1;
}

ul.controls {
	flex-shrink: 0;

	display: flex;
	flex-direction: row;
	align-items: center;

	background: rgba(189, 161, 78, 0.2);

	border: 0;
	margin: 0;
	padding: 0.5rem 0.2rem;
}

ul.controls > li {
	flex-grow: 0;
	order: 0;

	display: block;

	border: 0;
	margin: 0;
	padding: 0;
}

ul.controls > li.close {
	margin: 0 0.5rem;
}

ul.controls > li.close > a {
	font-size: 0;

	display: inline-block;
	vertical-align: top;

	opacity: 0.3;
}

ul.controls > li.close > a:focus,
ul.controls > li.close > a:active,
ul.controls > li.close > a:hover {
	opacity: 1;
}

ul.controls > li.close > a::before {
	display: inline-block;
	vertical-align: top;

	content: "";

	width: 24px;
	height: 24px;

	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAAsklEQVR4Ae2WsQrEIBAFH/iRUfN1yUnIRwoeuXKbc1CbsGM/g1ssK8dxXkxQ0aZedp0KTH+rqXYmdlU1XSRR1H6vKnbqn/dRN1HVJv7q7X95AutBIgE9INkE1/ME14NEBnpAtgmk5wmo54n5ejN1oOcJql8fWD8irq9mR03Xb4okwfUPKMH1NpGm6cGmHdXzBNfbRB7Sg007oJ+aOPv0JnGQw+vCh1dRWHk6HgpyHOe1fAE3Nwx9TaPILQAAAABJRU5ErkJggg==);
	background-size: cover;

	text-decoration: none;
}

ul.controls > li.title {
	flex-grow: 1;
	padding-left: 1rem;
}

ul.controls > li.title > h2 {
	margin: 0;
}

.hint-text {
	margin: auto;
	font-style: italic;
	font-size: 1.25em;
	color: #49075e;
}

/* Mobile and Tablet Styles */

.viewport-mobile .display-component,
.viewport-tablet .display-component {
	flex-basis: 100%;
	padding: 1rem;
}

.viewport-mobile .resource-display {
	font-size: 0.9em;
}
</style>
