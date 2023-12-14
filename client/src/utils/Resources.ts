import { Type as ResourceType } from "@/types/Resource";
import Url from "../components/resource/edit/Url.vue";
import VideoInternal from "../components/resource/edit/VideoInternal.vue";
import DocumentInternal from "../components/resource/edit/DocumentInternal.vue";
import DocumentExternal from "../components/resource/edit/DocumentExternal.vue";
import ServiceExternalLti from "../components/resource/edit/ServiceExternalLti.vue";
import QuizUq from "../components/resource/edit/quiz/QuizUq.vue";

/** An array to map components to resource types */
export const RESOURCE_MAP = [
	{
		resourceType: ResourceType.URL,
		label: "Link",
		component: Url,
	},
	{
		resourceType: ResourceType.DOCUMENT_INTERNAL,
		label: "Document (Editor)",
		component: DocumentInternal,
	},
	{
		resourceType: ResourceType.DOCUMENT_EXTERNAL,
		label: "Document (Link to external)",
		component: DocumentExternal,
	},
	{
		resourceType: ResourceType.QUIZ_UQ_CHEM,
		label: "Quiz",
		component: QuizUq,
	},
	{
		resourceType: ResourceType.RESOURCE_EXPLORER_INLINE_DOCUMENT_INTERNAL,
		label: "Note (Inline document)",
		component: DocumentInternal,
	},
	{
		resourceType: ResourceType.VIDEO_INTERNAL,
		label: "Video (Upload)",
		component: VideoInternal,
	},
	{
		resourceType: ResourceType.SERVICE_EXTERNAL_LTI,
		label: "LTI Tool",
		component: ServiceExternalLti,
	},
];

export interface Status {
	message: string;
	class: string;
}
export interface StatusType {
	[key: string]: Status;
}

/** Finds type object based on resource type from RESOURCE_MAP */
export const getTypeObjectByResourceType = (resourceType: ResourceType) =>
	RESOURCE_MAP.find((x) => x.resourceType === resourceType);

/** Finds component based on resource type from RESOURCE_MAP */
export const getResourceEditComponent = (resourceType: ResourceType) => {
	const typeObj = getTypeObjectByResourceType(resourceType);

	// Either returns `undefined` if `typeObj === undefined`; otherwise the
	// `.component` value
	return typeObj && typeObj.component;
};
