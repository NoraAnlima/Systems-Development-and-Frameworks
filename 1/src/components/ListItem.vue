<template>
    <div class="row">
        <div class="column">
            <input type="checkbox" id="done-checkbox" v-model="todo.done" @click="doneChanged">
        </div>
        <div class="column">
            <input v-if="editMode" v-model="tempName" id="new-name-input"
                   @keyup.enter="saveNewName" @keydown.esc="cancelNewName" />
            <p v-else :class="{ 'completed-todo-item': todo.done}" id="name-text">{{todo.name}}</p>
        </div>
        <div v-if="editMode" class="column">
            <button @click="saveNewName" id="save-change-button">Save</button>
            <button @click="cancelNewName" id="cancel-change-button">Cancel</button>
        </div>
        <div v-else class="column">
            <button @click="startEditMode" id="edit-button">Edit</button>
            <button @click="deleteClicked" id="delete-button">Delete</button>
        </div>
    </div>
</template>

<script lang="ts">
    import "reflect-metadata"
    import { Component, Prop, Vue } from "vue-property-decorator";
    import {ToDo} from "@/todo";

    @Component
    export default class ListItem extends Vue {
        @Prop() private todo!: ToDo;

        private editMode: boolean = false;
        private tempName: string = "";

        public isEditMode(): boolean {
            return this.editMode;
        }

        startEditMode() {
            this.tempName = this.todo.name;
            this.editMode = true;
        }

        saveNewName() {
            if (!this.editMode) {
                return;
            }

            this.$emit("name-changed", this.todo.id, this.tempName);
            this.editMode = false;
        }

        cancelNewName() {
            this.tempName = "";
            this.editMode = false;
        }

        deleteClicked() {
            this.$emit("delete-clicked", this.todo.id);
        }

        doneChanged() {
            if (this.editMode) {
                return;
            }

            this.$emit("done-changed", this.todo.id);
        }

    }
</script>

<style scoped>
    .row {
        display: grid;
        grid-template-columns: min-content auto min-content min-content;
        grid-template-rows: 30px;
    }

    .column {
        place-self: center;
        align-self: center;
        display: flex;
    }

    .completed-todo-item {
        text-decoration: line-through;
    }
</style>