import { Store } from "vuex";

declare module "@vue/runtime-core" {
	// declare your own store states
	interface State {
		session: Session | undefined;
		clipboard: Clipboard;
		viewport: ViewportMode | undefined;
	}
	// provide typings for `this.$store`
	interface ComponentCustomProperties {
		$store: Store<State>;
	}
}
