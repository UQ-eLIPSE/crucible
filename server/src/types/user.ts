import * as mongodb from "mongodb";
export enum PermissionLevel {
	// =========================================================================
	// NOTE: **Always** supply an enum value! **DO NOT** change existing ones!
	// =========================================================================
	// NOTE: **Check that enum values are not duplicated!**
	//
	// TypeScript does not verify that your enum values are unique!
	// This is aligned with other languages, but you need to be careful.
	// =========================================================================
	SYSTEM_ADMINISTRATOR = 0,

	ADMINISTRATOR = 10,

	GUEST = 100,
}

export interface IUser_Base {
	_id?: mongodb.ObjectId;

	username: string;

	permission: PermissionLevel;

	active: boolean;
}

export interface IUser_PlainTextPassword {
	password: {
		plain: string;
	};
}

export interface IUser_HashedPassword {
	password: {
		hash: string;
	};
}

export type IUser = IUser_Base &
	(IUser_PlainTextPassword | IUser_HashedPassword);
