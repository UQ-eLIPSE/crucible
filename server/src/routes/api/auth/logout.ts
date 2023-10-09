import * as express from "express";

// =============================================================================

export const logout: express.RequestHandler = async (req, res, next) => {
	// Logout via. Passport, which should destroy rest of session
	req.logout(next);

	// Send blank response with HTTP 200 upon success
	return res.status(200).json({});
};
