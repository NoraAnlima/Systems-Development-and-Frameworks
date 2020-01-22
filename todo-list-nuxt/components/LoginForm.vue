<template>
    <form @submit.prevent="onSubmit">
        <div>
            <h2 style="text-align:center">
                Login
            </h2>
            <div v-if="showError" class="alert">
                Error: Your login failed! Either the entered user doesn't exist, or the password is wrong.
            </div>
            <input v-model="username" type="text" name="username" placeholder="Username" required>
            <input v-model="password" type="password" name="password" placeholder="Password" required>
            <input type="submit" value="Login">
        </div>
    </form>
</template>

<script lang="ts">
    import "reflect-metadata";
    import {Component, Vue} from "nuxt-property-decorator";
    import gql from "graphql-tag";
    import {get} from "lodash";
    import {getModule} from "vuex-module-decorators";

    import AuthStoreModule from "~/store/auth";

    @Component
    export default class LoginForm extends Vue {
        private username: string = "";
        private password: string = "";
        private showError: boolean = false;

        created() {
            const token = this.$apolloHelpers.getToken();
            const authStoreModule = getModule(AuthStoreModule, this.$store);

            if (token && !authStoreModule.isAuthenticated) {
                authStoreModule.setIsAuthenticated(true);
                this.$router.push("/");
            }
        }

        async onSubmit(): Promise<void> {
            try {
                const result = await this.$apollo.mutate({
                    mutation: gql`
                    mutation Login($name: String!, $password: String!) {
                        login(name: $name, password: $password)
                    }
                `,
                    variables: {
                        name: this.username,
                        password: this.password
                    }
                });

                const authStoreModule = getModule(AuthStoreModule, this.$store);

                const token = get(result, "data.login");
                await this.$apolloHelpers.onLogin(token);
                authStoreModule.setIsAuthenticated(true);

                const resultUser = await this.$apollo.query({
                    query: gql`query { readOwnUser { name }}`
                });

                const userName = get(resultUser, "data.readOwnUser.name");
                authStoreModule.setUsername(userName);

                this.$router.push("/");
            } catch (e) {
                this.showError = true;
            }
        }
    }
</script>

<style scoped>
    .alert {
        color: red;
        font-style: italic;
        padding-bottom: 20px;
    }

    form {
        text-align: center;
    }
</style>
