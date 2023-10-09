import * as mongodb from "mongodb";
import { Database } from "../database";
import type {
	IResource,
	IResource_Quiz_UQ_Chem,
	IResource_Quiz_UQ_Chem_Old,
} from "../types/resource";
import { Type } from "../types/resource";

/**
 * This function converts all quizzes from:
 * - Old format array of Question objects (questionList)
 * - To array of children question IDs
 */
export async function convertQuiz() {
	const quizzes = await Database.Models.Resource.getByType(Type.QUIZ_UQ_CHEM);

	for (const quiz of quizzes) {
		// Leave out quizzes that are already in new format
		if ((quiz as mongodb.WithId<IResource_Quiz_UQ_Chem>).content.children)
			continue;
		const children = await Promise.all(
			(
				quiz as mongodb.WithId<IResource_Quiz_UQ_Chem_Old>
			).content.questionList
				.map(async (question, i) => {
					// Extract text from quiz or quiz parent's label
					const questionLabel = await getLabel(quiz, i);

					const newQuestion = {
						type: Type.QUIZ_QUESTION,
						label: questionLabel,
						tags: quiz.tags,
						thumbnail: null,
						permissions: quiz.permissions,
						_meta: quiz._meta,
						content: question,
					} as IResource;

					// Insert then return the saved resource
					const result = await Database.Models.Resource.insert(
						newQuestion
					);

					if (!result) {
						console.error(
							`Error saving question ${i} of ${quiz._id}`
						);
						return;
					}
					return result.insertedId;
				})
				.filter(
					(res): res is Promise<mongodb.ObjectId> => res !== undefined
				)
		);
		// Assemble quiz document by replacing quiz questionList with array of children
		delete (quiz as any).content.questionList;

		// Add children object ids to quiz
		(quiz as IResource_Quiz_UQ_Chem).content.children = children;

		// Update quiz resource
		Database.Models.Resource.updateById(quiz._id, quiz);
	}
}

/**
 * Extracts label for quiz from either:
 * - Text following a hyphen applied to the following cases
 * 	- "Test Your Knowledge - Control of the Autonomic Nervous System"
 * 	- "Test Your Knowledge: Control of the Autonomic Nervous System"
 * - Text of parent topic applied to the following cases
 * 	- "Test your Knowledge"
 * 	- "Quiz - Check your understanding"
 * 	- "Test your understanding"
 * 	- "Check your understanding"
 * @param quiz Quiz resource to get label from
 * @returns Label string
 */
async function getLabel(quiz: mongodb.WithId<IResource>, index: number) {
	// Extract label following a hyphen or colon
	const regex = RegExp("(?<=- )(.+)|(?<=: )(.+)").exec(quiz.label);
	// Check if remaining text does not contain 'Check your understanding'
	if (
		regex &&
		!regex[0]
			.toLocaleLowerCase()
			.includes("Check your understanding".toLocaleLowerCase())
	) {
		return `${regex[0]} Question ${index + 1}`;
	}

	// Get label from parent instead
	const parentLabel = await getParentLabel(quiz._id);

	return `${parentLabel} Question ${index + 1}`;
}

/**
 * Gets the label of a child's parent
 * Exclude labels that contain eg. 'Lecture 1' as it
 * is not a descriptive label
 * @param id ID of child object to get parents for
 * @returns Label of parent
 */
async function getParentLabel(id: mongodb.ObjectId): Promise<string> {
	// Get parent resources and check if not smart quiz
	const parents = await Database.Models.Resource.getParents(id);

	// Filter out all parents that are smart quizzes as we can't use their label
	parents.filter((parent) => {
		parent.type !== Type.RESOURCE_COLLECTION_SMART_QUIZ;
	});

	// We use first parent in list as a quiz question should be unique to only one
	// quiz in the database

	// Check if parent label contains the word 'lecture' and if so
	// extract the label from the parent of this parent
	return parents[0]?.label?.toLocaleLowerCase().includes("lecture")
		? await getParentLabel(parents[0]._id)
		: parents[0]?.label || "Fallback Label - the label does not exist";
}
