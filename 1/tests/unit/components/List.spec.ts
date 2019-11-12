import {mount, shallowMount, Wrapper} from "@vue/test-utils"
import List from "@/components/List.vue"
import ListItem from "@/components/ListItem.vue"
import {ToDo} from "@/todo";


describe("List.vue", () => {
    let wrapper: Wrapper<List>;

    describe("todo list is empty", () => {

        beforeEach(() => {
            wrapper = mount(List);
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

        it("adds a new todo when add button is clicked", () => {
            let inputField = <HTMLInputElement>wrapper.find("input[name='new-todo-input']").element;
            let buttons = wrapper.findAll("button");
            let addButton = buttons.filter((btn) => btn.text().toLowerCase() === "add").at(0);

            let newTodoName = "test todo";
            //right appoach, but doesn't work for some reason
            //inputField.value = newTodoName;
            wrapper.vm.$data.newTodoName = newTodoName;
            addButton.trigger("click");

            expect(wrapper.contains(ListItem)).toBeTruthy();
            expect(wrapper.vm.$data.todos[0].name).toStrictEqual(newTodoName);
        });
    });

    describe("todo list contains 3 todos", () => {
        beforeEach(() => {
            wrapper = shallowMount(List);

            wrapper.vm.$data.todos.push(new ToDo("do a todo"));
            wrapper.vm.$data.todos.push(new ToDo("modify a todo"));
            wrapper.vm.$data.todos.push(new ToDo("delete a todo"));
        });

        it("renders 3 todos", () => {
            let listItems = wrapper.findAll(ListItem);
            expect(listItems).toBeTruthy();
            expect(listItems.length).toStrictEqual(3);
        });

        it("handles delete-clicked correctly", () => {
            let allTodos: Array<ToDo> = wrapper.vm.$data.todos;
            let todoToDelete: ToDo = allTodos[0];
            let items = wrapper.findAll(ListItem);
            let itemToDelete = items.at(0);
            itemToDelete.vm.$emit("delete-clicked", todoToDelete.id);
            let todosAfterDelete: Array<ToDo> = wrapper.vm.$data.todos;

            expect(todosAfterDelete).toBeTruthy();
            expect(todosAfterDelete.length).toStrictEqual(2);
            expect(todosAfterDelete.find((t) => t.id === todoToDelete.id)).toBeFalsy();
        });

        it("handles name-changed correctly", () => {
            let todoToModify: ToDo = wrapper.vm.$data.todos[0];
            let items = wrapper.findAll(ListItem);
            let itemToModify = items.at(0);
            let changedTodoName = "changed ToDo name";
            itemToModify.vm.$emit("name-changed", todoToModify.id, changedTodoName);

            let modifiedTodo: ToDo = wrapper.vm.$data.todos[0];
            expect(modifiedTodo.name).toStrictEqual(changedTodoName);
        });

        it("handles done-changed correctly", () => {
            let todoToModify: ToDo = wrapper.vm.$data.todos[1];
            let items = wrapper.findAll(ListItem);
            let itemToModify = items.at(1);
            let changedDoneState = true;
            itemToModify.vm.$emit("done-changed", todoToModify.id, changedDoneState);

            let modifiedTodo: ToDo = wrapper.vm.$data.todos[1];
            expect(modifiedTodo.done).toBe(changedDoneState);
        });

    });
});
