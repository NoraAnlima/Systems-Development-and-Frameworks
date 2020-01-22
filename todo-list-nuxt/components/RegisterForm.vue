<template>
    <form @submit.prevent="onSubmit">
        <div>
            <h2 style="text-align:center">
                Register
            </h2>
            <div v-if="showError" class="alert">
                Error: Your registration failed! Your username is already taken, please try another one.
            </div>
            <input v-model="username" type="text" name="username" placeholder="Username" required>
            <input v-model="password" type="password" name="password" placeholder="Password" required>
            <input type="submit" value="Register">
        </div>
    </form>
</template>

<script lang="ts">
    import "reflect-metadata";
    import {Component, Vue} from "nuxt-property-decorator";
    import gql from "~/node_modules/graphql-tag";

    @Component
    export default class RegisterForm extends Vue {
        private username: string = "";
        private password: string = "";
        private showError: boolean = false;

        async onSubmit(): Promise<void> {
            try {
                await this.$apollo.mutate({
                    mutation: gql`
                    mutation CreateUser($name: String!, $password: String!) {
                        createUser(name: $name, password: $password) {
                            name
                        }
                    }
                `,
                    variables: {
                        name: this.username,
                        password: this.password
                    }
                });

                this.$router.push("/login");
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
