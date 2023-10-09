import { MongoClient, MongoClientOptions } from "mongodb";

// Models
import { Resource } from "../models/Resource";
import { User } from "../models/User";

/**
 * Interface for models stored on Database singleton
 */
interface DatabaseModels {
	Resource: Resource;
	User: User;
}

// NOTE: This is not the same as the built-in `Partial<T>` generic type!
//
// When applied to objects, this is the same as making all values possibly
// `undefined` but does not permit any keys to be missing from the object.
type MaybeValues<T> = { [K in keyof T]: T[K] | undefined };

export class Database {
	/**
	 * The private singleton models object
	 *
	 * The values may be undefined because when the server starts at runtime,
	 * nothing has happened until `Database.init()` is run.
	 */
	private static _Models: MaybeValues<DatabaseModels> = {
		Resource: undefined,
		User: undefined,
	};

	/**
	 * Initialises the Database singleton
	 *
	 * This should be run *once* at the start of the server's initialisation
	 * phase.
	 *
	 * @param uri Connection URI
	 * @param options Optional Mongo client options
	 *
	 * @returns Mongo client database instance
	 */
	public static async init(uri: string, options?: MongoClientOptions) {
		const mongoClient = new MongoClient(uri, options);

		await mongoClient.connect();

		const db = mongoClient.db();

		// Set up models for collections
		Database._Models = {
			Resource: new Resource(db),
			User: new User(db),
		};

		return db;
	}

	/**
	 * Connects to Mongo database at given URI
	 *
	 * @param uri Connection URI
	 * @param options Optional Mongo client options
	 *
	 * @returns Mongo client database instance
	 */
	public static connect(uri: string, options?: MongoClientOptions) {
		return new MongoClient(uri, options);
	}

	/**
	 * Retrieves models from the Database singleton
	 */
	public static get Models() {
		const models = Database._Models;

		// Go through all values to see if they're not yet defined
		for (const key in models) {
			// Using `any` type because no index signature exists on
			// `DatabaseModels` interface
			if ((models as any)[key] === undefined) {
				throw new Error("Database models not available");
			}
		}

		// We assume here that `models` is fully defined due to above
		// undefined check
		return models as DatabaseModels;
	}
}
