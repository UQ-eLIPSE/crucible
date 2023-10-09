import * as express from "express";
import * as ultimaLaunch from "ultima-launch";

import { getUserInfoPayloadUsingRequest } from "../../../../auth";
import { Database } from "../../../../database";
import { Resource } from "../../../../models/Resource";
import { IResource } from "../../../../types/resource";
import { getObjectId } from "../../../../middleware/helper";

// =============================================================================

/** Value for the nonce generator function */
let nonceCounter = 0;

function generateNonce() {
	// Generates 32 bit nonce value, and increments nonce for next cycle
	return (nonceCounter = (nonceCounter + 1) >>> 0);
}

export const generateLtiLaunchForm: express.RequestHandler = async (
	req,
	res,
	next
) => {
	// Determine if admin user signed in (any user is assumed to be admin)
	const isAdmin = req.user !== undefined;

	const objectId = getObjectId(req)!;

	try {
		const resource = await Database.Models.Resource.getBySingleId(objectId);
		if (!resource) {
			return next({
				status: 404,
				message: "Resource not found",
			});
		}

		const resourceToReturn = { ...resource } as IResource;

		// If the resource is not of LTI type, we return a 404 to say that
		// "there is no LTI service resource with that ID"
		if (!Resource.IsServiceExternalLTI(resourceToReturn)) {
			return next({
				status: 404,
				message: "Resource not found",
			});
		}

		// Query SSO for user info
		const userInfo = await getUserInfoPayloadUsingRequest(req);

		// If there is no user information, the launch can't proceed because
		// we don't have enough info
		if (userInfo === undefined) {
			return next({
				status: 401,
				message:
					"User not authorised or user data not associated with session",
			});
		}

		// Extract info from SSO login
		const {
			firstname: lis_person_name_given,
			lastname: lis_person_name_family,
			user: user_id,
			email: lis_person_contact_email_primary,
			name: lis_person_name_full,
		} = userInfo;

		// We assume that all launches are student by default, and only
		// appear as instructors if they're actually logged into the system
		// as an administrator
		const roles = isAdmin ? "Instructor" : "Student";

		// LTI launch information
		const { launchUrl, consumerKey, secret } = resourceToReturn.content;
		const nonce = "" + generateNonce();
		const resourceLinkId = objectId.toHexString();

		// Start compiling LTI data object
		const ltiPayload = {
			// First we have all the minimal payload information
			...ultimaLaunch.LTIPayload.generateUnsignedMinimalPayload(
				consumerKey,
				nonce,
				resourceLinkId
			),

			// Then we add the parameters we generally need for most tools
			user_id,
			roles,
			lis_person_name_full,
			lis_person_name_family,
			lis_person_name_given,
			lis_person_contact_email_primary,
		};

		ltiPayload.oauth_timestamp = Date.now().toString().substr(0, 10);

		// Sign
		const signedPayload = ultimaLaunch.Signature.signPayload(
			launchUrl,
			"POST",
			secret,
			ltiPayload
		);
		console.log(signedPayload);
		// Generate form
		const formHtml = ultimaLaunch.Form.createFormHTMLString(
			signedPayload,
			launchUrl,
			{
				submitButtonValue:
					"Click this button to continue if you do not automatically proceed",
				target: "_self",
			}
		);

		// Form rest of document, then send it down
		const entireDocumentHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title></title></head><body>${formHtml}<script>var form=document.forms[0];form.submit();form.style.display="none";setTimeout(function(){form.style.display="block";},3000);</script></body></html>`;

		return res.status(200).send(entireDocumentHtml);
	} catch (e) {
		return next(e);
	}
};
