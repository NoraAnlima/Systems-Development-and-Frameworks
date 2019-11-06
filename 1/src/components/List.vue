<template>
    <div style="width: 300px">
        <input v-model="newTodoName" placeholder="New Todo"
               @keyup.enter="addNewTodo"/>
        <button @click="addNewTodo" >Add</button>
        <list-item v-for="todo in todos" v-model="todos" :key="todo.id"
                  :todo="todo"
                  @delete-clicked="todoDelete"
                  @name-changed="nameChanged"
                  @done-changed="doneChanged" >
        </list-item>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";
    import ListItem from "@/components/ListItem.vue";
    import {ToDo} from "@/todo";

    @Component({components: {ListItem}})
    export default class List extends Vue {
        private newTodoName: string = "";
        private todos: Array<ToDo> = [];

        addNewTodo() {
            let newTodo = new ToDo(this.newTodoName);
            this.todos.push(newTodo);
            this.newTodoName = "";

            console.log(this.todos);
        }

        todoDelete(id: number) {
            let todo = this.todos.filter(t => t.id === id);

            if (!todo) {
                console.debug("element to delete doesn't exist with id: " + id);
                return;
            }

            console.debug("deleting element with id: " + id);
            this.todos = this.todos.filter(t => t.id !== id);
        }

        nameChanged(id: number, newName: string) {
            let todo = this.todos.find(t => t.id === id);

            if (!todo) {
                console.debug("element to rename doesn't exist with id: " + id);
                return;
            }

            console.debug("renaming element with id: " + id);
            todo.name = newName;
        }

        doneChanged(id: number, newChangedValue: boolean) {
            let todo = this.todos.find(t => t.id === id);

            if (!todo) {
                console.debug("element to change done status doesn't exist with id: " + id);
                return;
            }

            console.debug("changing done status for element with id: " + id);
            todo.done = newChangedValue;
        }
    }
</script>

<style scoped>

</style>