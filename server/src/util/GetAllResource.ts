import * as mongodb from "mongodb";
import { Database } from "../database";
import type {
	IResourceChildren,
	IResource_Base,
	IResource_Collection,
	IResource_Collection_Topic_Bundle,
	IResource_Inline_Document_Internal,
	IResource_Service_External_LTI,
	IResource_Smart_Quiz,
	IResource_Document_Internal,
	IResource_Document_External,
	IResource_Url,
	IResource_Video_Internal,
	IResource_Video_External_Kaltura,
	IResource_Quiz_UQ_Chem,
	IResource_Quiz_UQ_Chem_Database,
	IResource_Quiz_UQ_Chem_Old,
	IResource_Quiz_Question,
} from "../types/resource";
import { Type } from "../types/resource";

interface IResourceTree extends IResource_Base {
	children?: mongodb.WithId<IResource>[];
}

export type IResource = IResourceTree &
	(
		| IResource_Collection
		| IResource_Collection_Topic_Bundle
		| IResource_Smart_Quiz
		| IResource_Inline_Document_Internal
		| IResource_Service_External_LTI
		| IResource_Document_Internal
		| IResource_Document_External
		| IResource_Url
		| IResource_Video_Internal
		| IResource_Video_External_Kaltura
		| IResource_Quiz_UQ_Chem
		| IResource_Quiz_UQ_Chem_Database
		| IResource_Quiz_UQ_Chem_Old
		| IResource_Quiz_Question
	);

export async function getAllResources() {
	const resources = await Database.Models.Resource.getAllResources();
	function nestedTree(
		node: mongodb.WithId<IResource>
	): mongodb.WithId<IResource> {
		if (node === null) return node;
		if (
			node.content &&
			(node as IResourceChildren).content.children &&
			(node as IResourceChildren).content.children.length > 0
		) {
			// node must be of IResourceChildren type
			node.children = (node as IResourceChildren).content.children
				.map((resource: mongodb.ObjectId) => {
					let child: mongodb.WithId<IResource> | undefined;
					let index = -1;

					for (let i = 0; i < resources.length; i++) {
						if (String(resources[i]._id) === String(resource)) {
							child = resources[i];
							index = i;
							break;
						}
					}

					if (index !== -1) {
						resources.splice(index, 1);
					}
					return child;
				})
				.filter(
					(child): child is mongodb.WithId<IResource> =>
						child !== undefined
				);
		}

		if (node.children) {
			node.children.map((childItem: mongodb.WithId<IResource>) => {
				return nestedTree(childItem);
			});
		}

		delete node._meta;
		Reflect.deleteProperty(node, "_id");
		Reflect.deleteProperty(node, "permissions");
		Reflect.deleteProperty(node, "tags");
		Reflect.deleteProperty(node, "thumbnail");

		Reflect.set(node, "type", Type[node.type]);

		return node;
	}

	return resources.map((resource: mongodb.WithId<IResource>) => {
		const processedResource = nestedTree(resource);
		return processedResource.children
			? processedResource
			: ({} as mongodb.WithId<IResource>);
	});
}
