<template>
	<ul class="property-list">
		<li class="field">
			<label>
				<span class="field-label">Title</span>
				<div
					v-if="resourceLabelMessage"
					class="inline-message-box negative"
				>
					{{ resourceLabelMessageOutput }}
				</div>
				<input
					type="text"
					:value="resourceLabel"
					@input="$emit('update:resourceLabel', $event.target.value)"
				/>
			</label>
		</li>

		<!-- Tags field -->
		<li class="field">
			<label>
				<span class="field-label">Tags</span>
				<input
					type="text"
					:value="tagsAsString"
					@input="$emit('update:tagsAsString', $event.target.value)"
					placeholder="Enter comma separated tags..."
					cy-data="tags-field"
				/>
			</label>
		</li>

		<!-- Thumbnail edit component -->
		<li class="field">
			<label>
				<Thumbnail
					:isEdit="true"
					:resource="item"
					@thumbnailChanged="thumbnailHandler"
				>
				</Thumbnail>
			</label>
		</li>

		<!-- Visibility field -->
		<li class="field">
			<span class="field-label">Visibility</span>
			<label>
				<input
					type="checkbox"
					:checked="resourcePermissionsInternalHide"
					@change="
						$emit(
							'update:resourcePermissionsInternalHide',
							$event.target.checked
						)
					"
					class="standard-width"
					cy-data="visibility-checkbox"
				/>
				<span>Hide resource</span>
			</label>
		</li>

		<!-- SSO permissions switch -->
		<li class="field">
			<span class="field-label">Permissions</span>
			<label
				class="info"
				v-if="!isPermissionApplicable(item, authMechanism.uqsso)"
			>
				<em>
					"{{
						(getTypeObjectByResourceType(item.type) ||
						{ label: "Current resource " }).label
					}}" type resource cannot be locked with UQ SSO
				</em>
			</label>
			<label v-show="isPermissionApplicable(item, authMechanism.uqsso)">
				<input
					type="checkbox"
					:checked="resourcePermissionsUqsso"
					@change="
						$emit(
							'update:resourcePermissionsUqsso',
							$event.target.checked
						)
					"
					class="standard-width"
				/>
				<span>Enforce UQ SSO login to view this resource</span>
			</label>
			<label
				class="indented"
				v-show="
					resourcePermissionsUqsso &&
					isPermissionApplicable(item, authMechanism.uqsso)
				"
			>
				<input
					type="checkbox"
					:checked="resourcePermissionsUqssoStaffOnly"
					@change="
						$emit(
							'update:resourcePermissionsUqssoStaffOnly',
							$event.target.checked
						)
					"
					class="standard-width"
				/>
				<span>Only UQ Staff can view this resource</span>
			</label>
		</li>

		<component
			:is="getResourceEditComponent(item.type)"
			v-model:resource="item"
			ref="edit-component"
			:isEdit="true"
		>
		</component>
	</ul>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Thumbnail from "./Thumbnail.vue";
import { Type as ResourceType,IResource_FromServer, AuthMechanism } from "@/types/Resource";
import { getResourceEditComponent, getTypeObjectByResourceType } from "@/utils/Resources";

export default defineComponent({
	components: {
		Thumbnail,
	},
	props: {
		resourceLabel: String,
		tagsAsString: String,
		resourcePermissionsInternalHide: Boolean,
		item: Object as () => IResource_FromServer,
		resourceLabelMessage: String,
		resourceLabelMessageOutput: String,
		resourceLoaded: Boolean,
		resourcePermissionsUqsso: Boolean,
		resourcePermissionsUqssoStaffOnly: Boolean,
	},
	emits: [
		"update:resourceLabel",
		"update:tagsAsString",
		"update:resourcePermissionsInternalHide",
		"thumbnailChanged",
		"update:resourcePermissionsUqsso",
		"update:resourcePermissionsUqssoStaffOnly",
	],
	computed: {
		authMechanism() {
			return AuthMechanism;
		},
	},
	methods: {
		getResourceEditComponent,
		getTypeObjectByResourceType,
		thumbnailHandler(newThumbnail: string) {
			this.$emit("thumbnailChanged", newThumbnail);
		},
		isPermissionApplicable(
			item: IResource_FromServer,
			authMechanism: AuthMechanism
		) {
			if (!item) return false;
			switch (authMechanism) {
				case AuthMechanism.uqsso:
					// Permission is applicable for all resources except note or URL
					// Also, if item type does not exist, permission is not applicable
					return (
						item.type &&
						!(
							item.type === ResourceType.URL ||
							item.type ===
							ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL
						)
					);
				case AuthMechanism.internal:
					// At the moment, any resource can be hidden
					// i.e. this permission is applicable to all resource types
					return true;
				default:
					return false;
			}
		},
	},
});
</script>
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";
@import "@/assets/styles/resource/ResourceEditor.css";
</style>
