import * as express from "express";
import * as mongodb from "mongodb";

import { Database } from "../../../database";
import { getObjectId } from "../../../middleware/helper";
import { isResourceLocked } from "../../../resource/permission";
import {
	Partial__IResource,
	Hydrate,
	Resource,
} from "../../../models/Resource";
import {
	IResource,
	IResource_Base,
	IResource_Smart_Quiz,
	Type as ResourceType,
} from "../../../types/resource";

// =============================================================================

export const getById: express.RequestHandler = async (req, res, next) => {
	// Determine if admin user signed in (any user is assumed to be admin)
	const isAdmin = req.user !== undefined;

	const objectId = getObjectId(req)!;

	try {
		const resource = await Database.Models.Resource.getBySingleId(objectId);

		if (!resource) {
			return next({
				status: 404,
				message: "Resource not found",
			});
		}

		const resourceToReturn = {
			...resource,
		} as IResource;

		// Check whether resource is locked or not
		let resourceLocked: boolean;

		// The resource is always unlocked for admins, except for LTI tools,
		// otherwise we test whether the resource is indeed locked for this
		// request
		if (isAdmin && !Resource.IsServiceExternalLTI(resourceToReturn)) {
			resourceLocked = false;
		} else {
			resourceLocked = await isResourceLocked(resourceToReturn, req);
		}

		// Add `_currentlyLocked` flag to returned resources
		(resourceToReturn.permissions as any)._currentlyLocked = resourceLocked;

		// If NOT an admin and content locked, empty `content`
		//
		// This is because admins should always have access to the content,
		// regardless of the lock state
		if (!isAdmin && resourceLocked && resourceToReturn.content) {
			(resourceToReturn.content as any) = {};
		}

		return res.status(200).json(resourceToReturn);
	} catch (e) {
		return next(e);
	}
};

export const updateById: express.RequestHandler = async (req, res, next) => {
	const objectId = getObjectId(req)!;

	const resource: any = req.body;

	if (resource === undefined) {
		return next({
			status: 400,
			message: "Resource content not defined",
		});
	}

	// Check that we have a partial resource object
	if (!Partial__IResource.is(resource)) {
		return next({
			status: 400,
			message:
				"Resource content invalid or does not match expected object interface",
		});
	}

	try {
		// Get original resource in order to get the type we're updating for
		const originalResource = await Database.Models.Resource.getById(
			objectId
		);

		if (originalResource.length === 0) {
			return next({
				status: 404,
				message: "Resource not found",
			});
		}

		if (originalResource.length > 1) {
			return next({
				status: 500,
				message: "Encountered more than one resource with same ID",
			});
		}

		const originalResourceType = originalResource[0].type;

		// Hydrate to convert non-primitive values
		Hydrate(resource, originalResourceType);

		const result = await Database.Models.Resource.updateById(
			objectId,
			resource
		);

		// Update and return new record
		return res.status(200).json(result.value);
	} catch (e) {
		return next(e);
	}
};

/**
 * Deletes children of a resource recursively.
 * Then deletes the resource itself.
 * @param resource Resource object
 */
export const deleteResourcesRecursively = async (resource: IResource) => {
	// If resource is a collection / topic bundle, delete all its children
	if (Resource.IsCollection(resource)) {
		const children = await Promise.all(
			resource.content.children.map(async (child) => {
				const c = await Database.Models.Resource.getBySingleId(child);
				const childRes = {
					...c,
				} as IResource;
				return childRes;
			})
		);

		await Promise.all(
			children.map((child) => {
				return deleteResourcesRecursively(child);
			})
		);
	}

	// Delete the resource after any (potential) children have been deleted
	await Database.Models.Resource.deleteById(resource._id!);
};
/**
 * Deletes resource's ID from parent object's children array.
 * Then deletes resource itself.
 * Does not delete resultant orphan resources if resource being deleted is a collection / topic bundle.
 */
export const deleteById: express.RequestHandler = async (req, res, next) => {
	// Target object ID
	const objectId = getObjectId(req)!;

	try {
		// Get parent
		const parentResources = await Database.Models.Resource.getParents(
			objectId
		);

		if (parentResources.length > 1)
			throw new Error("More than one parent encountered.");

		if (parentResources.length === 1) {
			const parentUpdatePromises = parentResources.map((parent: any) => {
				// Remove the target object ID from children array
				const newChildrenArray = parent.content.children.filter(
					(childId: any) => !childId.equals(objectId)
				);

				// We only need a partial object to update the collection with
				const updateDelta: Partial<typeof parent> = {
					content: {
						children: newChildrenArray,
					},
				};

				// Return the Promise for the update
				return Database.Models.Resource.updateById(
					parent._id!,
					updateDelta
				);
			});

			// Wait for all parents to be updated
			await Promise.all(parentUpdatePromises);
		}
		// Get resource by ID
		const resourceById = await Database.Models.Resource.getBySingleId(
			objectId
		);

		const fullResource = {
			...resourceById,
		} as IResource;

		// Recursively delete resource
		await deleteResourcesRecursively(fullResource);

		return res.status(200).json({});
	} catch (e) {
		return next(e);
	}
};

/**
 * Returns a list of random questions
 * Gets specific number of questions by tag
 */
export const getQuestionsById: express.RequestHandler = async (
	req,
	res,
	next
) => {
	const objectId = getObjectId(req)!;

	try {
		const smartQuiz = await Database.Models.Resource.getBySingleId(
			objectId
		);

		// check that this smart quiz exists
		if (!smartQuiz) {
			return next({
				status: 404,
				message: "Smart Quiz not found",
			});
		}
		// Get an array of shuffled quiz questions
		const questions = await smartQuizQuestions(
			smartQuiz as IResource_Base & IResource_Smart_Quiz
		);

		return !questions
			? next({
				status: 400,
				message: "Unable to get Smart Quiz questions",
			})
			: res.status(200).json(questions);
	} catch (e) {
		return next(e);
	}
};

/**
 * Get specific number of shuffled children questions
 * @param resource Array of question resources
 */
export const smartQuizQuestions = async (
	smartQuiz: IResource_Base & IResource_Smart_Quiz
) => {
	// Get all question resources from database with type 101
	const questions = await Database.Models.Resource.getByType(
		ResourceType.QUIZ_QUESTION
	);

	// filter by questions which have the param current state
	const smartQuizQuestions: mongodb.WithId<IResource>[] = questions.filter(
		(question: IResource) => {
			if (question.type === 101) {
				return question.content.currentState && question;
			}
			return;
		}
	);

	// Shuffle all questions and extract only required number of questions
	const shuffledQuestions = shuffleArray(smartQuizQuestions).slice(
		0,
		smartQuiz.content.numQuestions
	);

	// Uncomment the following line if we want to clone questions to insert into Smart Quiz
	// resource.content.children = await insertChildren(
	// 	ids
	// );
	return shuffledQuestions as mongodb.WithId<IResource>[];
};

/**
 * Shuffle an array using the Fisher-Yates Drustenfield shuffle
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @param array Array of mongo object IDs
 */
const shuffleArray = (array: mongodb.WithId<IResource>[]) => {
	const shuffledArray = [...array];
	// Start from the last element and swap each element one by one
	for (const [i, value] of shuffledArray.entries()) {
		// Pick a random integer index from 0 to i
		const j = Math.floor(Math.random() * (i + 1));
		// Swap array index i with the element at random index
		[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], value];
	}
	return shuffledArray;
};
