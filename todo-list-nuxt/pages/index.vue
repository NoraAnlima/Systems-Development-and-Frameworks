<template>
    <div>
        <h2>My special ToDos</h2>
        <list />
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "nuxt-property-decorator";
    import List from "../components/List.vue";
    import LoginForm from "~/components/LoginForm.vue";

    @Component({components: {LoginForm, List}})
    export default class IndexPage extends Vue {
        get middleware() {
            return "auth";
        }
    }
</script>
