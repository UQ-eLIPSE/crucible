import * as mongodb from "mongodb";

export abstract class BaseModel<T extends mongodb.Document> {
	private collection: mongodb.Collection<T>;

	constructor(db: mongodb.Db, collection: string) {
		this.collection = db.collection<T>(collection);
	}

	public getCollection() {
		return this.collection;
	}
}
