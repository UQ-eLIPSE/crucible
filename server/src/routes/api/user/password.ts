import * as express from "express";
import * as mongodb from "mongodb";
import { Taipu } from "taipu";

import { Database } from "../../../database";
import { User } from "../../../models/User";
import { IUser } from "../../../types/user";

// =============================================================================

/** Expected interface of the `changePassword` handler's `req.body` */
interface IChangePassword {
	old: string;
	new: string;
}

/** Runtime interface checker for the `changePassword` handler's `req.body` */
const IChangePassword = new Taipu<IChangePassword>("IChangePassword", {
	old: String,
	new: String,
});

// =============================================================================

export const changePassword: express.RequestHandler = async (
	req,
	res,
	next
) => {
	// User of the requestor
	const requestUser = req.user as IUser;

	// User ID string as supplied in the URL (the edit target)
	const userToEditId = req.params.id as string | undefined;

	if (userToEditId === undefined) {
		return next({
			status: 400,
			message: "ID invalid or could not be parsed",
		});
	}

	// Attempt to parse ID
	let userToEditObjectId: mongodb.ObjectId;

	try {
		userToEditObjectId = new mongodb.ObjectID(userToEditId);
	} catch {
		return next({
			status: 400,
			message: "ID invalid or could not be parsed",
		});
	}

	// Currently we only permit users to change their own passwords
	if (!requestUser._id!.equals(userToEditObjectId)) {
		return next({
			status: 401,
			message: "User passwords can only be edited by own user",
		});
	}

	// Fetch user object
	//
	// Note that while we do currently enforce that users can only edit
	// their own passwords, we still fetch from the DB to ensure that we get
	// the full object every time.
	const userToEdit: any = (
		await Database.Models.User.getByObjectId(userToEditObjectId)
	)[0];

	// If there is no user at given ID, then we can't do anything
	if (userToEdit === undefined) {
		return next({
			status: 400,
			message: "Target user not found",
		});
	}

	// Get the change password info
	const changeInfo = req.body;

	// Check that we have the right object
	if (!IChangePassword.is(changeInfo)) {
		return next({
			status: 400,
			message:
				"Change password content invalid or does not match expected object interface",
		});
	}

	const { old: oldPassword, new: newPassword } = changeInfo;

	// Minimum password length check
	const minimumPasswordLength = 8; // TODO: Make configurable

	if (newPassword.length < minimumPasswordLength) {
		return next({
			status: 400,
			message: `Password too short; must be a minimum of ${minimumPasswordLength} characters long`,
		});
	}

	// Check that the old password is the same as what's currently stored
	// to check validity of request (that the user is the one triggering the
	// change)
	const oldPasswordPass = await User.MatchPlainTextPasswordWithHash(
		oldPassword,
		userToEdit.password.hash
	);

	if (!oldPasswordPass) {
		return next({
			status: 401,
			message: "Old password is invalid",
		});
	}

	// Everything is good; change password
	const userToEditWithNewPassword = User.WritePlainTextPassword(
		userToEdit,
		newPassword
	);

	try {
		const updateResult = await Database.Models.User.update(
			userToEditWithNewPassword
		);

		// We expect that there is always 1 and only 1 object updated
		if (updateResult.modifiedCount !== 1) {
			throw new Error();
		}
	} catch {
		return next({
			status: 500,
			message: "Could not update user",
		});
	}

	// Send blank response with HTTP 200 upon success
	return res.status(200).json({});
};
