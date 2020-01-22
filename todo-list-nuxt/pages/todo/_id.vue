<template>
    <div>Hi, I'am todo number: {{todoId}}</div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";

    @Component
    export default class SingleTodoPage extends Vue {
        get todoId() {
            return this.$route.params.id;
        }
    }
</script>
