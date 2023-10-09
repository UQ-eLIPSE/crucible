import * as mongodb from "mongodb";
import * as bcrypt from "bcryptjs";

import { BaseModel } from "./BaseModel";
import { getConfig } from "../util/Config";
import type * as userType from "../types/user";

export class User extends BaseModel<userType.IUser> {
	constructor(db: mongodb.Db) {
		super(db, "User");
	}

	public async insert(
		user: userType.IUser_Base & userType.IUser_PlainTextPassword
	) {
		const userWithHashedPassword =
			await User.ConvertStoredPlainTextPasswordToHashedPassword(user);

		// Insert into DB
		return this.getCollection().insertOne(userWithHashedPassword);
	}

	public async update(user: userType.IUser) {
		const _id = user._id;

		if (!_id) {
			throw new Error("No ID associated on user data object");
		}

		// If password is not hashed, write hashed one in
		if (!User.HasHashedPassword(user)) {
			user = await User.ConvertStoredPlainTextPasswordToHashedPassword(
				user
			);
		}

		// Update this object in the DB
		return this.getCollection().replaceOne({ _id }, user);
	}

	/**
	 * @param id ID of user to get
	 * @param isActive `true` = get only active users, `false` = get only inactive users, `undefined` = don't care
	 */
	public async getById(id: string, isActive: boolean | undefined = true) {
		const _id = new mongodb.ObjectId(id);

		return this.getByObjectId(_id, isActive);
	}

	/**
	 * @param id Object ID of user to get
	 * @param isActive `true` = get only active users, `false` = get only inactive users, `undefined` = don't care
	 */
	public async getByObjectId(
		id: mongodb.ObjectId,
		isActive: boolean | undefined = true
	) {
		// Build DB query for user with given ID
		const query: {
			_id: mongodb.ObjectId;
			active: boolean | undefined;
		} = {
			_id: id,
			active: isActive,
		};

		// Remove `active` flag if we don't care about active-ness
		if (isActive === undefined) {
			delete query.active;
		}

		// Return a read only object by default
		return this.getCollection().find(query, {}).toArray();
	}

	public async getByUsername(username: string) {
		// Return a read only object by default
		return this.getCollection()
			.find({
				username,
			})
			.toArray();
	}

	// =========================================================================

	public static StripPassword(user: Readonly<userType.IUser>) {
		// Copy object while dropping the `password` property
		const { password, ...bareUser } = user;

		return bareUser as userType.IUser_Base;
	}

	public static async HashPassword(password: string) {
		// Get authorisation configuration
		const authConfig = getConfig().AUTH;
		const salt = await bcrypt.genSalt(authConfig.PASSWORD_HASH_ROUNDS);

		return bcrypt.hash(password, salt);
	}

	public static async MatchPlainTextPasswordWithHash(
		password: string,
		hash: string
	) {
		return bcrypt.compare(password, hash);
	}

	public static HasHashedPassword(
		user: Readonly<userType.IUser>
	): user is Readonly<userType.IUser_Base & userType.IUser_HashedPassword>;
	public static HasHashedPassword(
		user: userType.IUser
	): user is userType.IUser_Base & userType.IUser_HashedPassword {
		return (
			(user as userType.IUser_HashedPassword).password.hash !== undefined
		);
	}

	public static WritePlainTextPassword(
		user: Readonly<userType.IUser>,
		password: string
	) {
		// Copy object out and overwrite password with plain text one
		const userWithPlainTextPassword: userType.IUser_Base &
			userType.IUser_PlainTextPassword = {
				...user,
				password: {
					plain: password,
				},
			};

		return userWithPlainTextPassword;
	}

	public static async ConvertStoredPlainTextPasswordToHashedPassword(
		user: Readonly<userType.IUser_Base & userType.IUser_PlainTextPassword>
	) {
		// Process plain text password into hashed value
		const hash = await User.HashPassword(user.password.plain);

		// Copy object out and overwrite password with hashed one
		const userWithHashedPassword: userType.IUser_Base &
			userType.IUser_HashedPassword = {
				...user,
				password: {
					hash,
				},
			};

		return userWithHashedPassword;
	}
}
