import {Module, VuexModule, Mutation} from "vuex-module-decorators";

@Module({
    name: "auth",
    stateFactory: true,
    namespaced: true
})
export default class AuthStoreModule extends VuexModule {
    private _username: string = "";
    private _isAuthenticated: boolean = false;

    @Mutation
    setUsername(username: string) {
        this._username = username;
    }

    @Mutation
    setIsAuthenticated(isAuthenticated: boolean) {
        this._isAuthenticated = isAuthenticated;
    }

    get username() {
        return this._username;
    }

    get isAuthenticated() {
        return this._isAuthenticated;
    }
}
