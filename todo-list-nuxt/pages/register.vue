<template>
    <register-form />
</template>

<script lang="ts">
    import {Component, Vue} from "nuxt-property-decorator";
    import RegisterForm from "~/components/RegisterForm.vue";

    @Component({components: {RegisterForm}})
    export default class RegisterPage extends Vue {
    }
</script>
