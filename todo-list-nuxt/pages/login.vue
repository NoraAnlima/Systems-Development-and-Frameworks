<template>
    <login-form />
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";
    import LoginForm from "~/components/LoginForm.vue";

    @Component({components: {LoginForm}})
    export default class LoginPage extends Vue {
    }
</script>
