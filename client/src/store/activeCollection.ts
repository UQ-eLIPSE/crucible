import { reactive } from "vue";

export const collectionId = reactive({
	path: "",
	value: 0,
});

// we save our quiz questions and do not call the api again
export const quizCollectionSnapshot = reactive({
	smartQuizId: "",
	isSnapShot: false,
	data: ({} as any) || undefined,
});
