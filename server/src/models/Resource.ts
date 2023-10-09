import * as mongodb from "mongodb";
import { Taipu, or } from "taipu";

import { BaseModel } from "./BaseModel";
import { Binary } from "bson";
import { Type } from "../types/resource";
import type * as resource from "../types/resource";

export class Resource extends BaseModel<resource.IResource> {
	constructor(db: mongodb.Db) {
		super(db, "Resource");
	}

	/**
	 * Insert one resource into Resource collection
	 * @param resource Resource of type IResource
	 * @returns Inserted resource with auto generated ID
	 */
	public async insert(resource: resource.IResource) {
		return await this.getCollection().insertOne(resource);
	}

	public async getAllResources() {
		return await this.getCollection().find({}, { projection: { label: 1, _id: 1, type: 1, content: 1}}).toArray();
	}

	/**
	 * Get all collection roots with type RESOURCE_COLLECTION_ROOT
	 * @returns Array of collection roots
	 */
	public async getCollectionRoots() {
		return await this.getCollection()
			.find({
				type: Type.RESOURCE_COLLECTION_ROOT,
			})
			.toArray();
	}

	/**
	 * Get parents of child document
	 * @param objectId MongoDB object id of child resource
	 * @returns Array of parent collections for child
	 */
	public async getParents(objectId: mongodb.ObjectId) {
		return await this.getCollection()
			.find({
				type: {
					$in: [
						Type.RESOURCE_COLLECTION_ROOT as any,
						Type.RESOURCE_COLLECTION_TOPIC_BUNDLE as any,
						Type.RESOURCE_COLLECTION as any,
						Type.RESOURCE_COLLECTION_SMART_QUIZ as any,
					],
				},
				"content.children": objectId,
			})
			.toArray();
	}

	/**
	 * Get all documents by type (used to get questions for Smart Quiz)
	 * - Also filter out resources that contain Test tag and hidden is true
	 * @param type Type ID of resource given from Types enum
	 * @returns Array of documents that have the given type
	 */
	public async getByType(type: number) {
		return await this.getCollection()
			.find({
				type: type,
				tags: { $ne: "Test" },
			})
			.toArray();
	}

	/**
	 * Get all documents by a tag
	 * @param tag String of tag to search for
	 * @returns Array of documents that have the tag
	 */
	public async getByTag(tag: string) {
		return await this.getCollection()
			.find({
				tags: tag,
			})
			.toArray();
	}

	/**
	 * Get multiple resources by IDs
	 * @param ids Array of MongoDB object IDs
	 * @returns Array of documents
	 */
	public async getById(...ids: mongodb.ObjectId[]) {
		return await this.getCollection()
			.find({
				_id: {
					$in: ids,
				},
			})
			.toArray();
	}

	/**
	 * Get one document by id
	 * @param id MongoDB object ID
	 * @returns One document with given ID
	 */
	public async getBySingleId(id: mongodb.ObjectId) {
		return await this.getCollection().findOne({
			_id: new mongodb.ObjectId(id),
		});
	}

	/**
	 * Update one document
	 * @param id ObjectID of the record to update.
	 * @param data Partial object to update the record with. Note that `_id` will always be ignored from this object.
	 * @param returnOriginal `true` = return original document before update; `false` = return new document after update; default = `false`
	 */
	public async updateById(
		id: mongodb.ObjectId,
		data: Partial<resource.IResource>
	) {
		// Note that the `_id` field is always ignored in input data
		const { _id, ...updateData } = data;

		return await this.getCollection().findOneAndUpdate(
			{
				_id: id,
			},
			{
				$set: updateData,
			},
			{
				returnDocument: "after",
			}
		);
	}

	/**
	 * Delete one document by ID
	 * @param id MongoDB object ID
	 * @returns Object with number of documents deleted
	 */
	public async deleteById(id: mongodb.ObjectId) {
		return await this.getCollection().deleteOne({
			_id: id,
		});
	}

	/**
	 * Check if resource matches a collection interface
	 * @param resource Resource of type IResource
	 * @param fallbackType Default type to use
	 */
	public static IsCollection(
		resource: resource.IResource,
		fallbackType?: Type
	): resource is resource.IResource_Base &
		(
			| resource.IResource_Collection
			| resource.IResource_Collection_Topic_Bundle
			| resource.IResource_Smart_Quiz
		);
	/**
	 * Checks if partial resource matches a collection interface
	 * @param resource Partial resource of type IResource
	 * @param fallbackType Default type to use
	 */
	public static IsCollection(
		resource: Partial<resource.IResource>,
		fallbackType?: Type
	): resource is Partial<
		resource.IResource_Base &
			(
				| resource.IResource_Collection
				| resource.IResource_Collection_Topic_Bundle
				| resource.IResource_Smart_Quiz
			)
	>;
	/**
	 * Checks if resource is of type colection
	 * @param resource Full or partial resource of type IResource
	 * @param fallbackType Default type to use
	 * @returns Boolean if resource is a Collection or not
	 */
	public static IsCollection(
		resource: Partial<resource.IResource> | resource.IResource,
		fallbackType?: Type
	): boolean {
		const type = resource.type || fallbackType;

		return (
			type === Type.RESOURCE_COLLECTION ||
			type === Type.RESOURCE_COLLECTION_ROOT ||
			type === Type.RESOURCE_COLLECTION_TOPIC_BUNDLE ||
			type === Type.RESOURCE_COLLECTION_SMART_QUIZ
		);
	}

	/**
	 * Checks if resource is of type Collection Root
	 * @param resource Resource of type IResource
	 * @returns Boolean if resource is a Collection Root or not
	 */
	public static IsCollectionRoot(resource: resource.IResource) {
		return resource.type === Type.RESOURCE_COLLECTION_ROOT;
	}

	/**
	 * Check if resource is of type External Service LTI
	 * @param resource Resource of type IResource
	 * @returns Boolean if resource is a External Service LTI or not
	 */
	public static IsServiceExternalLTI(
		resource: resource.IResource
	): resource is resource.IResource_Base &
		resource.IResource_Service_External_LTI {
		return resource.type === Type.SERVICE_EXTERNAL_LTI;
	}

	/**
	 * Check if resource is of type Video Internal
	 * @param resource Resource of type IResource
	 * @returns Boolean if resource is a Internal Video or not
	 */
	public static IsCanContainObjectStoreContent(resource: resource.IResource) {
		const type = resource.type;

		return type === Type.VIDEO_INTERNAL;
	}
}

// Runtime Data
export const IThumbnailData = new Taipu<resource.IThumbnailData>(
	"IThumbnailData",
	{
		url: String,
		size: String,
	}
);

export const IThumbnailUpload = new Taipu<resource.IThumbnailUpload>(
	"IThumbnailUpload",
	{
		file: or(Binary, undefined),
		url: or(String, undefined),
	}
);

export const Permissions = new Taipu<resource.Permissions>("Permissions", {
	// Do not accept `_currentlyLocked` from client
	_currentlyLocked: undefined,

	auth: or(
		Object, // IAuthConfig
		undefined
	),
});

export const IResource = new Taipu<resource.IResource>("IResource", {
	// Do not accept `_key` from client
	_key: undefined,

	type: Number,
	label: String,
	tags: Array, // string[]
	thumbnail: or(IThumbnailData, null, undefined, IThumbnailUpload),
	permissions: Permissions,
	content: or(
		Object, // Arbitrary payload depends on type
		undefined
	),
});

export const Partial__IResource = Taipu.CreatePartialType(IResource);

export function Hydrate(object: resource.IResource, fallbackType?: Type): void;
export function Hydrate(
	object: Partial<resource.IResource>,
	fallbackType: Type
): void;
export function Hydrate(
	object: Partial<resource.IResource> | resource.IResource,
	fallbackType?: Type
): void {
	if (Resource.IsCollection(object, fallbackType)) {
		return HydrateCollection(
			object as Partial<
				resource.IResource_Base &
					(
						| resource.IResource_Collection
						| resource.IResource_Collection_Topic_Bundle
					)
			>
		);
	}

	// Other object types do not need further hydration

	// Do not return; side effects present
}

function HydrateCollection(
	object: Partial<
		resource.IResource_Base &
			(
				| resource.IResource_Collection
				| resource.IResource_Collection_Topic_Bundle
			)
	>
) {
	// Map out string IDs into Mongo IDs
	if (object.content && object.content.children) {
		object.content.children = (
			object.content.children as any as string[]
		).map((id) => new mongodb.ObjectId(id));
	}

	// Do not return; side effects present
}
