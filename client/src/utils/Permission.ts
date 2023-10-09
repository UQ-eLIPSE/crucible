import type { IResource_Base } from "@/types/Resource";
import { AuthMechanism } from "@/types/Resource";

export function createAuthObjectIfNotExist(resource: IResource_Base) {
	if (!resource) return;

	if (!resource.permissions) {
		resource["permissions"] = {};
	}

	if (!resource.permissions.auth) {
		resource.permissions["auth"] = {};
	}

	if (!resource.permissions.auth![AuthMechanism.uqsso]) {
		resource.permissions.auth![AuthMechanism.uqsso] = {
			basic: false,
			staffOnly: false,
		};
	} else {
		resource.permissions.auth![AuthMechanism.uqsso] = {
			basic: !!resource.permissions.auth![AuthMechanism.uqsso]!.basic,
			staffOnly:
				!!resource.permissions.auth![AuthMechanism.uqsso]!.staffOnly,
		};
	}

	if (!resource.permissions.auth![AuthMechanism.internal]) {
		resource.permissions.auth![AuthMechanism.internal] = {
			hidden: false,
		};
	} else {
		resource.permissions.auth![AuthMechanism.internal] = {
			hidden: !!resource.permissions.auth![AuthMechanism.internal]!
				.hidden,
		};
	}
}
