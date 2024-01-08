<template>
	<div class="save-bar">
		<button
			class="button"
			@click.prevent="$emit('save')"
			cy-data="save-button"
		>
			Save
		</button>

		<button
			class="button delete-button"
			v-if="!isCollectionRoot"
			@click.prevent="$emit('delete')"
		>
			Delete
		</button>
	</div>
</template>

<script>
export default {
	props: ["isCollectionRoot"],
};
</script>
<style lang="scss" scoped>
@import "@/assets/styles/global/ResourceEdit.css";
@import "@/assets/styles/global/InlineMessageBox.css";
@import "@/assets/styles/resource/ResourceEditor.css";
</style>
