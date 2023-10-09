import * as express from "express";
import { UserInfoPayload } from "uq-eait-sso/types/UserInfoPayload";

import { getUserInfoPayloadUsingRequest } from "../auth";
import { IResource, AuthMechanism } from "../types/resource";

// =============================================================================

/**
 * A map between the auth provider name (e.g. "uqsso") and their respective
 * result object/value (typed as `any` as we don't know what they could be)
 */
type AuthResultCacheMap = Map<string, any>;

/**
 * Creates a map object for the caching of auth results between multiple
 * permission checks
 */
export function createPermissionAuthResultCacheMap() {
	return new Map<string, any>() as AuthResultCacheMap;
}

/**
 * Tests whether the resource is locked according to the set permissions object
 * on the resource
 *
 * Note that admin check has already been done prior to calling this function,
 * so req.user has no bearing on (current) functionality
 *
 * Note that the auth result cache map will automatically be filled with new
 * entries if the entries do not already exist.
 *
 * @param resource The resource to test
 * @param expressRequest The `req` object in Express handlers
 * @param authResultCacheMap Optional auth result cache map to store and fetch auth results from
 */
export async function isResourceLocked(
	resource: IResource,
	expressRequest: express.Request,
	authResultCacheMap?: AuthResultCacheMap
) {
	// Content locking is indicated in the `permissions` of the resource
	const resourceLocked = false;
	if (!(resource && resource.permissions && resource.permissions.auth))
		return resourceLocked;

	// If there are auth providers requested...
	const authObject = resource.permissions.auth;
	const authProviders = Object.keys(authObject);

	// Check auth mechanisms in order of preference

	// Check if resource has been hidden
	if (authProviders.indexOf(AuthMechanism.internal) !== -1) {
		// Check internal auth mechanism
		if (resource.permissions.auth![AuthMechanism.internal]) {
			const internalAuthConfig =
				resource.permissions.auth![AuthMechanism.internal];
			if (internalAuthConfig && internalAuthConfig.hidden) {
				return true;
			}
		}
	}

	// Check if resource is blocked by UQ SSO
	if (authProviders.indexOf(AuthMechanism.uqsso) !== -1) {
		if (
			resource.permissions.auth[AuthMechanism.uqsso] &&
			resource.permissions.auth![AuthMechanism.uqsso]!.basic
		) {
			let ssoPayload: UserInfoPayload | undefined;

			// Check for SSO session
			if (
				authResultCacheMap &&
				authResultCacheMap.has(AuthMechanism.uqsso)
			) {
				// Fetch previous result
				ssoPayload = authResultCacheMap.get(AuthMechanism.uqsso);
			} else {
				// Query SSO server
				ssoPayload = await getUserInfoPayloadUsingRequest(
					expressRequest
				);

				// Set result in cache map if available
				authResultCacheMap &&
					authResultCacheMap.set(AuthMechanism.uqsso, ssoPayload);
			}

			// Content is locked if there is no payload
			// (indicating no SSO session)
			if (!ssoPayload) {
				return true;
			}

			if (
				ssoPayload &&
				resource.permissions.auth![AuthMechanism.uqsso]!.staffOnly &&
				ssoPayload.type !== "Staff"
			) {
				// Check if resource is restricted to UQ Staff
				return true;
			}
		}
	}

	return false;
}
