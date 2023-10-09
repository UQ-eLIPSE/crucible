import * as mongodb from "mongodb";
import { Database } from "../database";
import type { IResourceChildren } from "../types/resource";
import { Type } from "../types/resource";

/**
 * Loop through all resources to apply tag to children
 * resources that have parent with given tag
 * @param tag String tag to be applied to all children
 */
export async function addChildrenTags(tag: string) {
	const resources = await Database.Models.Resource.getByTag(tag);

	for (const resource of resources) {
		// If resource doesn't have children skip this resource
		if (
			!Object.prototype.hasOwnProperty.call(
				resource.content,
				"children"
			) ||
			resource.type === Type.RESOURCE_COLLECTION_SMART_QUIZ
		)
			continue;

		// Loop through all levels of children and update their tags
		await nestedChildren(
			(resource as IResourceChildren).content.children,
			tag
		);
	}
}

/**
 * Loops through deeply nested children
 * @param children Array of children Object IDs
 * @param tag String tag to be applied to all children
 */
async function nestedChildren(children: mongodb.ObjectId[], tag: string) {
	// Loop through children
	for (const child of children) {
		const childResource = await updateChildTag(child, tag);
		// If couldn't get child, is a smart quiz collection or doesn't have children continue
		if (
			!childResource ||
			childResource.type === Type.RESOURCE_COLLECTION_SMART_QUIZ ||
			!Object.prototype.hasOwnProperty.call(
				childResource.content,
				"children"
			)
		)
			continue;

		// Conntinue down children levels
		nestedChildren(
			(childResource as IResourceChildren).content.children,
			tag
		);
	}
}

/**
 * Gets child resource by ID, adds tag and updates the resource
 * @param resource Child resource Object ID
 */
async function updateChildTag(resource: mongodb.ObjectId, tag: string) {
	// Get full child resource
	const childResource = await Database.Models.Resource.getBySingleId(
		resource
	);

	// Don't apply tag if resource is a smart quiz collection
	if (
		!childResource ||
		childResource.type === Type.RESOURCE_COLLECTION_SMART_QUIZ
	)
		return;

	// Give the children the parent tags or keep existing ones
	if (!childResource.tags.includes(tag)) childResource.tags.push(tag);

	// Update
	return (
		await Database.Models.Resource.updateById(
			childResource._id,
			childResource
		)
	).value;
}
