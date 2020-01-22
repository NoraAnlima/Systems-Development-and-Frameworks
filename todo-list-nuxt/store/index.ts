import Vuex from "vuex";
import AuthStoreModule from "~/store/auth";

export function createStore() {
    return new Vuex.Store({
        modules: {
            AuthStoreModule
        }
    });
};
