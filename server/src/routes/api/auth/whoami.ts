import * as express from "express";

import { User } from "../../../models/User";
import { IUser } from "../../../types/user";
import { getConfig } from "../../../util/Config";
// =============================================================================

export const whoami: express.RequestHandler = async (req, res) => {
	if (req.user){
		const userWithoutPassword = User.StripPassword(req.user as IUser);
		// Send back user information without password
		return res.status(200).json(userWithoutPassword);
	}
	if (res.locals.user){
		return res.status(200).json(res.locals.user);
	}

	return res.status(500)
};

export const ssoLogin = async (_req: express.Request, res: express.Response) => {
	if (!res.locals.user)
		return res.status(401).json({ error: "Unauthorized" });

	return res.redirect(getConfig().CLIENT.ADDRESS);
};
