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
            expect(wrapper.find("input[name='new-todo-input']").exists()).toBe(true);
        });

        it("renders an add button", () => {
            let buttons = wrapper.findAll("button");
            expect(buttons.length).toStrictEqual(1);
            buttons = buttons.filter((btn) => btn.text().toLowerCase() === "add");
            expect(buttons.length).toStrictEqual(1);
        });

        it("renders no todos", () => {
            expect(wrapper.contains(ListItem)).toBeFalsy();
        });

        it("adding a new todo works", () => {

        });
    });

    describe("todo list contains 3 todos", () => {
        beforeEach(() => {
            wrapper = shallowMount(List);

            wrapper.vm.$data.todos.push(new ToDo("add a todo"));
            wrapper.vm.$data.todos.push(new ToDo("modify a todo"));
            wrapper.vm.$data.todos.push(new ToDo("delete a todo"));
        });

        it("renders 3 todos", () => {
            let listItems = wrapper.findAll(ListItem);
            expect(listItems).toBeTruthy();
            expect(listItems.length).toStrictEqual(3);
        });

        it("delete-clicked is handled correctly", () => {
            let todoToDelete: ToDo = wrapper.vm.$data.todos[0];
            let items = wrapper.findAll(ListItem);
            let itemToDelete = items.at(0);
            itemToDelete.vm.$emit("delete-clicked", todoToDelete.id);

            expect(wrapper.vm.$data.todos).toBeTruthy();
            expect(wrapper.vm.$data.todos.length).toStrictEqual(2);

            // todo: check if really the selected entry is gone
        });

        it("name-changed is handled correctly", () => {

        });

        it("done-changed is handled correctly", () => {

        });

    });
});
