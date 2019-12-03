describe("mutate", () => {
    describe("given an authorized user", () => {
        describe("createTodo", () => {
            it.todo("adds the new todo into storage");
            it.todo("returns a new todo");
            it.todo("initializes new todos as not done");
        });
        describe("updateTodoName", () => {
            it.todo("changes the todo in storage");
            it.todo("returns the changed todo");
            it.todo("returns null on invalid id");
        });
        describe("updateTodoDone", () => {
            it.todo("changes the todo in storage");
            it.todo("returns the changed todo");
            it.todo("returns null on invalid id");
        });
        describe("deleteTodo", () => {
            it.todo("removes the todo from storage");
            it.todo("returns the removed todo");
            it.todo("returns null on invalid id");
            it.todo("returns null on todo id from another user");
            it.todo("doesn't remove todo from another user from storage");
        });
        describe("createUser", () => {
            it.todo("adds a new user to the storage");
        });
    });
    describe("given a non authorized user", () => {
        describe("createTodo", () => {
            it.todo("raises an error");
        });
        describe("updateTodoName", () => {
            it.todo("raises an error");
        });
        describe("updateTodoDone", () => {
            it.todo("raises an error");
        });
        describe("deleteTodo", () => {
            it.todo("raises an error");
        });
        describe("createUser", () => {
            it.todo("adds a new user to the storage");
        });
    });
});