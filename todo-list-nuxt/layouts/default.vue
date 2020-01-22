<template>
    <div class="center">
        <nav>
            <ul>
                <li>
                    <nuxt-link to="/">
                        My ToDos
                    </nuxt-link>
                </li>
                <li v-if="isAuthenticated" class="right">
                    <a @click="logout">Logout ({{ username }})</a>
                </li>
                <li v-if="!isAuthenticated" class="right">
                    <nuxt-link to="/login">
                        Login
                    </nuxt-link>
                </li>
                <li v-if="!isAuthenticated" class="right">
                    <nuxt-link to="/register">
                        Register
                    </nuxt-link>
                </li>
            </ul>
        </nav>
        <div>
            <nuxt />
        </div>
    </div>
</template>

<script lang="ts">
    import "reflect-metadata";
    import {Component, Vue} from "nuxt-property-decorator";
    import {getModule} from "vuex-module-decorators";
    import AuthStoreModule from "~/store/auth";

    @Component
    export default class DefaultLayout extends Vue {
        private authStoreModule = getModule(AuthStoreModule, this.$store);

        get isAuthenticated() {
            return this.authStoreModule.isAuthenticated;
        }

        get username() {
            return this.authStoreModule.username;
        }

        logout() {
            this.authStoreModule.setIsAuthenticated(false);
            this.authStoreModule.setUsername("");
            this.$apolloHelpers.onLogout();
            this.$router.push("/login");
        }
    }
</script>

<style scoped>
    * {
        font-family: sans-serif;
    }

    .center {
        margin: auto;
        width: 800px;
    }

    nav {
        padding-bottom: 20px;
    }

    ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #333;
    }

    li {
        float: left;
    }

    .right {
        float: right;
    }

    li a {
        display: block;
        color: white;
        text-align: center;
        padding: 14px 16px;
        text-decoration: none;
        cursor: pointer;
    }

    /* Change the link color to #111 (black) on hover */
    li a:hover {
        background-color: #111;
    }
</style>
