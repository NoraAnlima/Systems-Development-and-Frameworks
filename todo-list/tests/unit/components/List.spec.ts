import {shallowMount, Wrapper} from "@vue/test-utils"
import List from "@/components/List.vue"
import ListItem from "@/components/ListItem.vue"
import {ToDo} from "@/todo";


describe("List.vue", () => {
    let wrapper: Wrapper<List>;

    describe("todo list is empty", () => {

        beforeEach(() => {
            wrapper = shallowMount(List);
        });

        it("renders an input field", () => {
            let inputField = wrapper.find("#new-todo-input");

            expect(inputField.exists()).toBeTruthy();
        });

        it("renders an add button", () => {
            let addButton = wrapper.find("#add-button");

            expect(addButton.exists()).toBeTruthy();
        });

        it("renders no todos", () => {
            expect(wrapper.contains(ListItem)).toBeFalsy();
        });

        it("adds a new todo when add button is clicked", () => {
            let newTodoName = "test todo";

            let inputField = wrapper.find("#new-todo-input");
            let addButton = wrapper.find("#add-button");

            inputField.setValue(newTodoName);
            addButton.trigger("click");

            expect(wrapper.contains(ListItem)).toBeTruthy();
            expect(wrapper.vm.$data.todos[0].name).toStrictEqual(newTodoName);
        });
    });

    describe("todo list contains 3 todos", () => {
        beforeEach(() => {
            wrapper = shallowMount(List);

            const todoNames: Array<string> = [
                "do a todo",
                "modify a todo",
                "delete a todo"
            ];

            let inputField = wrapper.find("#new-todo-input");
            let addButton = wrapper.find("#add-button");

            for (let name in todoNames) {
                inputField.setValue(name);
                addButton.trigger("click")
            }
        });

        it("renders 3 todos", () => {
            let listItems = wrapper.findAll(ListItem);

            expect(listItems).toHaveLength(3);
        });

        it("handles delete-clicked correctly", () => {
            let items = wrapper.findAll(ListItem);
            let itemToDelete = items.at(0);
            let todoToDelete: ToDo = itemToDelete.vm.$props.todo;

            itemToDelete.vm.$emit("delete-clicked", todoToDelete.id);
            let itemsAfterDelete = wrapper.findAll(ListItem);
            let filteredItemsAfterDelete = itemsAfterDelete.filter(
                (i) => i.vm.$props.todo.id === todoToDelete.id);

            expect(itemsAfterDelete).toHaveLength(2);
            expect(filteredItemsAfterDelete).toHaveLength(0);
        });

        it("handles name-changed correctly", () => {
            let items = wrapper.findAll(ListItem);
            let itemToModify = items.at(0);
            let todoToModify: ToDo = itemToModify.vm.$props.todo;

            let changedTodoName = "changed ToDo name";
            itemToModify.vm.$emit(
                "name-changed", todoToModify.id, changedTodoName);

            expect(todoToModify.name).toStrictEqual(changedTodoName);
        });

        it("handles done-changed correctly", () => {
            let items = wrapper.findAll(ListItem);
            let itemToModify = items.at(1);
            let todoToModify: ToDo = itemToModify.vm.$props.todo;

            let changedDoneState = true;
            itemToModify.vm.$emit(
                "done-changed", todoToModify.id, changedDoneState);

            expect(todoToModify.done).toBe(changedDoneState);
        });

    });
});
