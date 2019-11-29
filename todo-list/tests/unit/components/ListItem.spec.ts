import {shallowMount, Wrapper} from "@vue/test-utils"
import ListItem from "@/components/ListItem.vue"
import {ToDo} from "@/todo";

describe("ListItem.vue", () => {

    describe("given a not completed todo", () => {

        const todo = new ToDo("test");
        let wrapper: Wrapper<ListItem>;

        beforeEach(() => {
            wrapper = shallowMount(ListItem, {
                propsData: {todo: todo}
            });
        });

        it("renders the checkbox", () => {
            expect(wrapper.find("#done-checkbox").exists()).toBeTruthy();
        });

        it("doesn't apply the done css class to #name-text", () => {
            let nameElement = wrapper.find("#name-text");

            expect(nameElement.classes()).not.toContain("completed-todo-item");
        });

        it("renders the name (not editable)", () => {
            let nameElement = wrapper.find("#name-text");

            expect(nameElement.text()).toStrictEqual(todo.name);
        });

        it("renders only two buttons", () => {
            let buttons = wrapper.findAll("button");

            expect(buttons).toHaveLength(2);
        });

        it("renders delete button", () => {
            let deleteButton = wrapper.find("#delete-button");

            expect(deleteButton.exists()).toBeTruthy();
        });

        it("renders edit button", () => {
            let editButton = wrapper.find("#edit-button");

            expect(editButton.exists()).toBeTruthy();
        });

        it("edit button starts editmode on click", () => {
            let editButton = wrapper.find("#edit-button");

            editButton.trigger("click");
            expect(wrapper.find("#new-name-input").exists()).toBeTruthy();
        });

        it("delete button emits deletion event on click", () => {
            let deleteButton = wrapper.find("#delete-button");

            deleteButton.trigger("click");
            expect(wrapper.emitted("delete-clicked")).toBeTruthy();
        });
    });

    describe("given a not completed todo and edit mode was entered ", () => {

        const todo = new ToDo("test");
        let wrapper: Wrapper<ListItem>;

        beforeEach(() => {
            wrapper = shallowMount(ListItem, {
                propsData: {todo: todo}
            });
            let editButton = wrapper.find("#edit-button");
            editButton.trigger("click");
        });

        it("renders input field", () => {
            expect(wrapper.find("#new-name-input").exists()).toBeTruthy();
        });

        it("renders save button", () => {
            let saveButton = wrapper.find("#save-change-button");

            expect(saveButton.exists()).toBeTruthy();
        });

        it("renders cancel button", () => {
            let cancelButton = wrapper.find("#cancel-change-button");

            expect(cancelButton.exists()).toBeTruthy();
        });

        it("emits save event when save button is clicked", () => {
            let saveButton = wrapper.find("#save-change-button");
            saveButton.trigger("click");

            expect(wrapper.emitted("name-changed")).toBeTruthy();
        });

        it("ends edit mode without a change when cancel button is clicked", () => {
            let cancelButton = wrapper.find("#cancel-change-button");
            let nameBeforeCancel = todo.name;
            cancelButton.trigger("click");

            expect(wrapper.find("#new-name-input").exists()).toBeFalsy();
            expect(nameBeforeCancel).toEqual(todo.name);
        });
    });

    describe("given a completed todo", () => {

        const todo = new ToDo("test");
        todo.done = true;
        let wrapper: Wrapper<ListItem>;

        beforeEach(() => {
            wrapper = shallowMount(ListItem, {
                propsData: {todo: todo}
            });
        });

        it("applies the correct css class (completed-todo-item) to #name-text", () => {
            let nameElement = wrapper.find("#name-text");

            expect(nameElement.classes()).toContain("completed-todo-item");
        });
    });

});
