import * as express from "express";
import * as passport from "passport";
import { SSO } from "uq-eait-sso";
import { Strategy as LocalStrategy } from "passport-local";

import { Database } from "../database";
import { getConfig } from "../util/Config";
import { User } from "../models/User";

/**
 * Sets up Passport's user object serialisation for sessions
 */
export function setupSessionSerialisation(passport: passport.PassportStatic) {
	// TODO: Fix user type (change from any)
	passport.serializeUser((user: any, done) => {
		if (user._id === undefined) {
			return done("No ID associated on user data object");
		}

		return done(null, user._id.toString());
	});

	passport.deserializeUser(async (id: string, done) => {
		const users = await Database.Models.User.getById(id);

		if (users.length === 0) {
			return done("User not found");
		}

		const user = users[0];
		return done(null, user);
	});
}

/**
 * Sets up the Local Authentication Strategy for Passport
 */
export function setupLocalStrategy(passport: passport.PassportStatic) {
	passport.use(
		new LocalStrategy(async (username, password, done) => {
			// Find the user object from the DB
			const users = await Database.Models.User.getByUsername(username);

			if (users.length === 0) {
				return done(null, false, {
					message: "Credentials invalid or user not found",
				});
			}

			// Match passwords
			const user = <any>users[0]!;

			const passwordsMatch = await User.MatchPlainTextPasswordWithHash(
				password,
				user.password.hash
			);

			if (!passwordsMatch) {
				return done(null, false, {
					message: "Credentials invalid or user not found",
				});
			}

			// Set user into session
			return done(null, user);
		})
	);
}

// Get configuration parameters for UQ SSO
const CONFIG = getConfig();
const DOMAIN = CONFIG.AUTH.UQSSO_SERVER_DOMAIN;
const PROTOCOL = CONFIG.AUTH.UQSSO_SERVER_PROTOCOL;

const TOKEN_COOKIE_NAME = "EAIT_WEB";
const LOGIN_SUCCESS_REDIRECT_URL = `${PROTOCOL}://${DOMAIN}/_uqsso/return/success`;

// Note that this will only work on UQCloud zones as EAIT do IP checks on
// SSO auth requests
const sso = new SSO(DOMAIN);

export function getUserInfoPayload(token: string) {
	return sso.getUserInfoPayload(token);
}

export function getTokenFromRequest(req: express.Request) {
	const token: string | undefined = (req.cookies || {})[TOKEN_COOKIE_NAME];
	return token;
}

export function setTokenToResponse(res: express.Response, token: string) {
	// Set token into cookie
	res.cookie(TOKEN_COOKIE_NAME, token, {
		httpOnly: true,
		maxAge: 14400000, // 4 hours
		sameSite: "strict",
	});

	// Do not return; side effects present
	return;
}

export function getRedirectUrl() {
	return sso.generateRedirectUrl(LOGIN_SUCCESS_REDIRECT_URL);
}

export async function getUserInfoPayloadUsingRequest(req: express.Request) {
	const token = getTokenFromRequest(req);

	if (token === undefined) {
		return undefined;
	}

	const payload = await getUserInfoPayload(token);

	return payload;
}
