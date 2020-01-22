<template>
    <div style="width: 300px">
        <input id="new-todo-input" v-model="newTodoName" placeholder="New Todo" @keyup.enter="addNewTodo">
        <button id="add-button" @click="addNewTodo">
            Add
        </button>
        <list-item
            v-for="todo in todos"
            :key="todo.id"
            v-model="todos"
            :todo="todo"
            @delete-clicked="todoDelete"
            @name-changed="nameChanged"
            @done-changed="doneChanged"
        />
    </div>
</template>

<script lang="ts">
    import "reflect-metadata";
    import {Component, Vue} from "nuxt-property-decorator";
    import {get} from "lodash";
    import gql from "graphql-tag";

    import ListItem from "@/components/ListItem.vue";
    import {ToDo} from "~/types/todo";

    @Component({components: {ListItem}})
    export default class List extends Vue {
        private newTodoName: string = "";
        private todos: Array<ToDo> = [];

        async created() {
            try {
                const result = await this.$apollo.query({
                    query: gql`query { readTodos { id name done assignee { name }}}`
                });

                const rawTodos: Array<{id: number, name: string, done: boolean}> = get(result, "data.readTodos");
                this.todos = rawTodos.map(t => new ToDo(t.id, t.name, t.done));
                console.log(this.todos);
            } catch (e) {
                console.log(e);
            }
        }

        async addNewTodo() {
            try {
                const result = await this.$apollo.mutate({
                    mutation: gql`
                        mutation CreateTodo($name: String!) {
                            createTodo(name: $name) {
                                id name done assignee { name }
                            }
                        }`,
                    variables: {
                        name: this.newTodoName
                    }
                });

                const rawTodo = get(result, "data.createTodo");
                const newTodo = new ToDo(rawTodo.id, rawTodo.name, rawTodo.done);
                this.todos.push(newTodo);
            } catch (e) {
                console.log(e);
            }
        }

        async todoDelete(id: number) {
            try {
                const result = await this.$apollo.mutate({
                    mutation: gql`
                        mutation DeleteTodo($id: Int!) {
                            deleteTodo(id: $id) {
                                id name done assignee { name }
                            }
                        }`,
                    variables: {
                        id
                    }
                });

                const rawTodo = get(result, "data.deleteTodo");

                if (!rawTodo) {
                    return;
                }

                this.todos = this.todos.filter(t => t.id !== id);
            } catch (e) {
                console.log(e);
            }
        }

        async nameChanged(id: number, newName: string) {
            try {
                const result = await this.$apollo.mutate({
                    mutation: gql`
                        mutation UpdateTodo($id: Int!, $name: String, $done: Boolean) {
                            updateTodo(id: $id, name: $name, done: $done) {
                                id name done assignee { name }
                            }
                        }`,
                    variables: {
                        id,
                        name: newName
                    }
                });

                const rawTodo = get(result, "data.updateTodo");

                if (!rawTodo) {
                    return;
                }

                const todo = this.todos.find(t => t.id === id);

                if (!todo) {
                    return;
                }

                todo.name = rawTodo.name;
            } catch (e) {
                console.log(e);
            }
        }

        async doneChanged(id: number, newChangedValue: boolean) {
            console.log(newChangedValue);
            try {
                const result = await this.$apollo.mutate({
                    mutation: gql`
                        mutation UpdateTodo($id: Int!, $name: String, $done: Boolean) {
                            updateTodo(id: $id, name: $name, done: $done) {
                                id name done assignee { name }
                            }
                        }`,
                    variables: {
                        id,
                        done: newChangedValue
                    }
                });

                const rawTodo = get(result, "data.updateTodo");

                if (!rawTodo) {
                    return;
                }

                const todo = this.todos.find(t => t.id === id);

                if (!todo) {
                    return;
                }

                todo.done = rawTodo.done;
                console.log(todo.done);
            } catch (e) {
                console.log(e);
            }
        }
    }
</script>

<style scoped>

</style>
