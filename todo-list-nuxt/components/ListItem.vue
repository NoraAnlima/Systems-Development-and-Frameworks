<template>
    <div class="row">
        <div class="column">
            <input id="done-checkbox" v-model="todo.done" type="checkbox" @click="doneChanged">
        </div>
        <div class="column">
            <input
                v-if="editMode"
                id="new-name-input"
                v-model="tempName"
                @keyup.enter="saveNewName"
                @keydown.esc="cancelNewName"
            >
            <p v-else id="name-text" :class="{ 'completed-todo-item': todo.done}">
                {{ todo.name }}
            </p>
        </div>
        <div v-if="editMode" class="column">
            <button id="save-change-button" @click="saveNewName">
                Save
            </button>
            <button id="cancel-change-button" @click="cancelNewName">
                Cancel
            </button>
        </div>
        <div v-else class="column">
            <button id="edit-button" @click="startEditMode">
                Edit
            </button>
            <button id="delete-button" @click="deleteClicked">
                Delete
            </button>
        </div>
    </div>
</template>

<script lang="ts">
    import "reflect-metadata";
    import {Component, Prop, Vue} from "vue-property-decorator";
    import {ToDo} from "~/types/todo";

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

            this.$emit("done-changed", this.todo.id, !this.todo.done);
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
