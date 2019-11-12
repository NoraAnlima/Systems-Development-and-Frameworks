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
            expect(wrapper.find("input[type='checkbox'][name='done']").exists()).toBe(true);
        });

        it("renders the name (not editable)", () => {
            expect(wrapper.find("p").text()).toStrictEqual(todo.name);
        });

        it("renders only two buttons", () => {
            let buttons = wrapper.findAll("button");
            expect(buttons.length).toStrictEqual(2);
        });

        it("renders delete button", () => {
            let buttons = wrapper.findAll("button");
            buttons = buttons.filter((btn) => btn.text().toLowerCase() === "delete");
            expect(buttons.length).toStrictEqual(1);
        });

        it("renders edit button", () => {
            let buttons = wrapper.findAll("button");
            buttons = buttons.filter((btn) => btn.text().toLowerCase() === "edit");
            expect(buttons.length).toStrictEqual(1);
        });

        it("edit button starts editmode on click", () => {
            let buttons = wrapper.findAll("button");
            let editButton = buttons.filter((btn) => btn.text().toLowerCase() === "edit").at(0);

            editButton.trigger("click");
            expect(wrapper.vm.$data.editMode).toBe(true);
        });

        it("delete button emits deletion event on click", () => {
            let buttons = wrapper.findAll("button");
            let deleteButton = buttons.filter((btn) => btn.text().toLowerCase() === "delete").at(0);

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
          wrapper.vm.$data.editMode = true;
        });

        it("renders input field", () => {
            expect(wrapper.find("input[name='name']").exists()).toBe(true);
        });

        it("renders save button", () => {
          let buttons = wrapper.findAll("button");
          buttons = buttons.filter((btn) => btn.text().toLowerCase() === "save");
          expect(buttons.length).toStrictEqual(1);
        });

        it("renders cancel button", () => {
          let buttons = wrapper.findAll("button");
          buttons = buttons.filter((btn) => btn.text().toLowerCase() === "cancel");
          expect(buttons.length).toStrictEqual(1);
        });

        it("emits save event when save button is clicked", () => {
          let buttons = wrapper.findAll("button");
          let saveButton = buttons.filter((btn) => btn.text().toLowerCase() === "save").at(0);

          saveButton.trigger("click");
          expect(wrapper.emitted("name-changed")).toBeTruthy();
        });

        it("ends edit mode without a change when cancel button is clicked", () => {
          let buttons = wrapper.findAll("button");
          let cancelButton = buttons.filter((btn) => btn.text().toLowerCase() === "cancel").at(0);

          let nameBeforeCancel = todo.name;
          cancelButton.trigger("click");
          expect(wrapper.vm.$data.editMode).toBe(false);
          expect(nameBeforeCancel).toEqual(todo.name);
        })
    })
});
