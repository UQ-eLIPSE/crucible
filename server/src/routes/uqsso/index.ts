import * as express from "express";
import {
	getRedirectUrl,
	getTokenFromRequest,
	getUserInfoPayload,
} from "../../auth";

// =============================================================================

export const informParentWindowOfSuccess: express.RequestHandler = async (
	_req,
	res,
	_next
) => {
	// Send a basic HTML document that just pings the originating window
	// that the UQ SSO sign in process has completed successfully
	return res.status(200).sendFile("InformParentWindowOfSuccess.html", {
		root: "./src/routes/uqsso",
	});
};

export const redirectToLogin: express.RequestHandler = async (
	_req,
	res,
	_next
) => {
	const redirectUrl = getRedirectUrl();

	// Redirect to UQ SSO login
	return res.redirect(redirectUrl);
};

export const testSsoToken: express.RequestHandler = async (req, res, _next) => {
	// Get token from cookie
	const token = getTokenFromRequest(req);

	// We expect token to always be 24 random bytes encoded as Base64
	// (32 bytes)
	if (token === undefined || token.length !== 32) {
		return res.status(200).json({ result: false });
	}

	const payload = await getUserInfoPayload(token);

	// See if we have a payload; if we do, then that means token is still
	// valid
	if (payload === undefined) {
		return res.status(200).json({ result: false });
	}

	return res.status(200).json({ result: true });
};
