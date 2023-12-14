<template>
	<div
		v-if="message"
		class="message"
		:class="messageStyles"
	>
		{{ message?.message }}
	</div>
</template>

<script>
export default {
	props: ["message", "messageStyles"],
};
</script>
