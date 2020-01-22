import {Middleware} from "@nuxt/types";
import {getModule} from "vuex-module-decorators";

import AuthStoreModule from "~/store/auth";

const auth: Middleware = (context) => {
    const authStoreModule = getModule(AuthStoreModule, context.store);
    if (!authStoreModule.isAuthenticated) {
        context.redirect("/login");
    }
};

export default auth;
