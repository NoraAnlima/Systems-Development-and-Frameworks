import {buildApolloServer} from "../../src";
import {InMemoryStorage, IStorage} from "../../src/data";
import {User, ToDo} from "../../src/types";
import {ApolloServerTestClient, createTestClient} from "apollo-server-testing";
import {gql} from "apollo-server";
import {sign} from "jsonwebtoken";

const READ_TODOS = gql`query { readTodos { id name done assignee { name }}} `;

const LOGIN = gql`
    mutation Login($name: String!, $password: String!) {
        login(name: $name, password: $password)
    }
`;

const CREATE_TODO = gql`
    mutation CreateTodo($name: String!) {
        createTodo(name: $name) {
            id name done assignee { name }
        }
    }
`;

const UPDATE_TODO_NAME = gql`
    mutation UpdateTodoName($id: Int!, $name: String!) {
        updateTodoName(id: $id, name: $name) {
            id name done assignee { name }
        }
    }
`;

const UPDATE_TODO_DONE = gql`
    mutation UpdateTodoDone($id: Int!, $done: Boolean!) {
        updateTodoDone(id: $id, done: $done)  {
            id name done assignee { name }
        }
    }
`;

const DELETE_TODO = gql`
    mutation DeleteTodo($id: Int!) {
        deleteTodo(id: $id)  {
            id name done assignee { name }
        }
    }
`;

const CREATE_USER = gql`
    mutation CreateUser($name: String!, $password: String!) {
        createUser(name: $name, password: $password) {
            name
        }
    }
`;

function buildTwoUserInMemoryStorage(addTodos: boolean = false): IStorage {
    let initialUsers = [
        new User("ralph", "ralph"),
        new User("nora", "nora")
    ];

    if (!addTodos) {
        return new InMemoryStorage(initialUsers);
    }

    let initialTodos = [
        new ToDo("first todo", initialUsers[1]),
        new ToDo("second todo", initialUsers[0]),
    ];

    return new InMemoryStorage(initialUsers, initialTodos);

}

describe("query", () => {
    const authSecret: string = "This is a perfect secret for testing!";
    let user: User;
    let storage: IStorage;
    let query: any;
    let mutate: any;


    describe("given a legit authorization token", () => {
        beforeEach(async () => {
            storage = buildTwoUserInMemoryStorage(true);

            // workaround for the shortcomings of the apollo-server-testing
            // package as it doesn't generate a real request and therefor a
            // "real" context will never be generated
            user = storage.readUser("ralph");
            const token = sign({username: user.name}, authSecret, {expiresIn: "1 day"});
            const context = {token: token, user: user};

            const testServer = buildApolloServer(storage, authSecret, false, context);
            const testClient = createTestClient(testServer);
            query = testClient.query;
            mutate = testClient.mutate;
        });

        describe("readTodos", () => {
            it("returns todos of authorized user", async () => {
               let response = await query({
                   query: READ_TODOS
               });

                expect(response.data.readTodos).toHaveLength(1);
            });
        });
    });
    describe("given a random authorization token", () => {
        beforeEach(async () => {
            storage = buildTwoUserInMemoryStorage(true);

            const context = {token: "I'm not a valid token"};

            const testServer = buildApolloServer(storage, authSecret, false, context);

            const testClient = createTestClient(testServer);
            query = testClient.query;
            mutate = testClient.mutate;
        });

        describe("readTodos", () => {
            it("raises an error", async () => {
                let response = await query({
                    query: READ_TODOS
                });

                expect(response.errors).toHaveLength(1);
                expect(response.data).toBeNull();
            });
        });
    });
});

describe("mutate", () => {
    const authSecret: string = "This is a perfect secret for testing!";

    describe("given correct user credentials", () => {
        const storage: IStorage = buildTwoUserInMemoryStorage();
        const testServer = buildApolloServer(storage, authSecret, false, {});
        const {query, mutate} = createTestClient(testServer);

        describe("login", () => {
            it("returns a jwt", async () => {
                let tokenResponse = await mutate({
                    mutation: LOGIN,
                    variables: {
                        name: "ralph",
                        password: "ralph"
                    }
                });

                expect(tokenResponse.data.login).toBeDefined();
            });
        });
    });

    describe("given wrong user credentials", () => {
        const storage: IStorage = buildTwoUserInMemoryStorage();
        const testServer = buildApolloServer(storage, authSecret, false, {});
        const {query, mutate} = createTestClient(testServer);

        describe("login", () => {
            it("returns null", async () => {
                let tokenResponse = await mutate({
                    mutation: LOGIN,
                    variables: {
                        name: "ralph",
                        password: "false"
                    }
                });

                expect(tokenResponse.data.login).toBeNull();
            });
        });
    });

    describe("given a legit authorization token", () => {
        let user: User;
        let storage: IStorage;
        let query: any;
        let mutate: any;

        beforeEach(async () => {
            storage = buildTwoUserInMemoryStorage();

            // workaround for the shortcomings of the apollo-server-testing
            // package as it doesn't generate a real request and therefor a
            // "real" context will never be generated
            user = storage.readUser("ralph");
            const token = sign({username: user.name}, authSecret, {expiresIn: "1 day"});
            const context = {token: token, user: user};

            const testServer = buildApolloServer(storage, authSecret, false, context);

            const testClient = createTestClient(testServer);
            query = testClient.query;
            mutate = testClient.mutate;
        });

        describe("createTodo", () => {
            it("adds the new todo into storage", async () => {
                expect(storage.readTodos(user)).toHaveLength(0);

                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(storage.readTodos(user)).toHaveLength(1);
            });

            it("returns a new todo", async () => {
                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(response.data.createTodo).toMatchObject({name: "new todo"});
            });

            it("initializes new todos as not done", async () => {
                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(response.data.createTodo).toMatchObject({name: "new todo", done: false});
            });
        });

        describe("given an existing todo", () => {
            let todo: ToDo;

            beforeEach(async () => {
                let response = await mutate(
                    {mutation: CREATE_TODO, variables: {name: "unedited todo"}});
                todo = storage.readTodo(user, response.data.createTodo.id);
            });

            describe("updateTodoName", () => {
                it("changes the todo in storage", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_NAME,
                        variables: {id: todo.id, name: "updated todo"}
                    });

                    expect(storage.readTodo(user, todo.id).name).toBe("updated todo");
                });

                it("returns the changed todo", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_NAME,
                        variables: {id: todo.id, name: "updated todo"}
                    });

                    expect(response.data.updateTodoName).toMatchObject({name: "updated todo"});
                });

                it("returns null on invalid id", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_NAME,
                        variables: {id: -10, name: "should not work"}
                    });

                    expect(response.data.updateTodoName).toBeNull();
                });
            });

            describe("updateTodoDone", () => {
                it("changes the todo in storage", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_DONE,
                        variables: {id: todo.id, done: true}
                    });

                    expect(storage.readTodo(user, todo.id).done).toBeTruthy();
                });

                it("returns the changed todo", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_DONE,
                        variables: {id: todo.id, done: true}
                    });

                    expect(response.data.updateTodoDone).toMatchObject({done: true});
                });

                it("returns null on invalid id", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO_DONE,
                        variables: {id: -10, done: true}
                    });

                    expect(response.data.updateTodoDone).toBeNull();
                });
            });

            describe("deleteTodo", () => {
                it("removes the todo from storage", async () => {
                    let response = await mutate({
                        mutation: DELETE_TODO,
                        variables: {
                            id: todo.id
                        }
                    });

                    expect(storage.readTodo(user, todo.id)).toBeNull();
                });

                it("returns the removed todo", async () => {
                    let response = await mutate({
                        mutation: DELETE_TODO,
                        variables: {
                            id: todo.id
                        }
                    });

                    expect(response.data.deleteTodo).toMatchObject({id: todo.id});
                });

                it("returns null on invalid id", async () => {
                    let response = await mutate({
                        mutation: DELETE_TODO,
                        variables: {
                            id: -10
                        }
                    });

                    expect(response.data.deleteTodo).toBeNull();
                });
            });
        });

        describe("given a todo from another user", () => {
            let todoFromOtherUser: ToDo;
            let otherUser: User;

            beforeEach(async () => {
                otherUser = storage.readUser("nora");
                todoFromOtherUser = storage.createTodo(otherUser, "my todo is protected");
            });

           describe("updateTodoName", () => {
               it("returns null", async () => {
                   let response = await mutate({
                       mutation: UPDATE_TODO_NAME,
                       variables: {id: todoFromOtherUser.id, name: "new todo name"}
                   });

                   expect(response.data.updateTodoName).toBeNull();
               });

               it("doesn't change the todo in storage", async () => {
                   let oldTodoName = storage.readTodo(otherUser, todoFromOtherUser.id).name;

                   let response = await mutate({
                       mutation: UPDATE_TODO_NAME,
                       variables: {id: todoFromOtherUser.id, name: "new todo name"}
                   });

                   expect(storage.readTodo(otherUser, todoFromOtherUser.id).name).toEqual(oldTodoName);
               });
           });

           describe("updateTodoDone", () => {
               it("returns null", async () => {
                   let response = await mutate({
                       mutation: UPDATE_TODO_DONE,
                       variables: {id: todoFromOtherUser.id, done: true}
                   });

                   expect(response.data.updateTodoDone).toBeNull();
               });

               it("doesn't change the todo in storage", async () => {
                   let response = await mutate({
                       mutation: UPDATE_TODO_DONE,
                       variables: {id: todoFromOtherUser.id, done: true}
                   });

                   expect(storage.readTodo(otherUser, todoFromOtherUser.id).done).toBeFalsy();
               });
           });

           describe("deleteTodo", () => {
               it("returns null", async () => {
                   let response = await mutate({
                       mutation: DELETE_TODO,
                       variables: {
                           id: todoFromOtherUser.id
                       }
                   });

                   expect(response.data.deleteTodo).toBeNull();
               });

               it("doesn't remove todo from storage", async () => {
                   let response = await mutate({
                       mutation: DELETE_TODO,
                       variables: {
                           id: todoFromOtherUser.id
                       }
                   });

                   expect(storage.readTodo(otherUser, todoFromOtherUser.id)).toBeTruthy();
               });
           });
        });

        describe("createUser", () => {
            it("adds a new user to the storage", async () => {
                let userName = "rudolphusTestus";

                let response = await mutate({
                    mutation: CREATE_USER,
                    variables: {
                        name: userName,
                        password: "123"
                    }
                });

                expect(storage.readUser(userName)).toMatchObject({name: userName});
            });
        });
    });

    describe("given a random authorization token", () => {
        let storage: IStorage;
        let query: any;
        let mutate: any;

        beforeEach(async () => {
            storage = buildTwoUserInMemoryStorage(true);

            const context = {token: "I'm not a valid token"};

            const testServer = buildApolloServer(storage, authSecret, false, context);

            const testClient = createTestClient(testServer);
            query = testClient.query;
            mutate = testClient.mutate;
        });

        describe("createTodo", () => {
            it("raises an error", async () => {
                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(response.errors).toHaveLength(1);
                expect(response.data.createTodo).toBeNull();
            });
        });

        describe("updateTodoName", () => {
            it("raises an error", async () => {
                let response = await mutate({
                    mutation: UPDATE_TODO_NAME,
                    variables: {
                        id: storage.readTodos(storage.readUser("nora"))[0].id,
                        name: "new todo name"
                    }
                });

                expect(response.errors).toHaveLength(1);
                expect(response.data.updateTodoName).toBeNull();
            });
        });

        describe("updateTodoDone", () => {
            it("raises an error", async () => {
                let response = await mutate({
                    mutation: UPDATE_TODO_DONE,
                    variables: {
                        id: storage.readTodos(storage.readUser("nora"))[0].id,
                        done: true
                    }
                });

                expect(response.errors).toHaveLength(1);
                expect(response.data.updateTodoDone).toBeNull();
            });
        });

        describe("deleteTodo", () => {
            it("raises an error", async () => {
                let response = await mutate({
                    mutation: DELETE_TODO,
                    variables: {
                        id: storage.readTodos(storage.readUser("nora"))[0].id
                    }
                });

                expect(response.errors).toHaveLength(1);
                expect(response.data.deleteTodo).toBeNull();
            });
        });

        describe("createUser", () => {
            it("adds a new user to the storage", async () => {
                let userName = "rudolphusTestus";

                let response = await mutate({
                    mutation: CREATE_USER,
                    variables: {
                        name: userName,
                        password: "123"
                    }
                });

                expect(storage.readUser(userName)).toMatchObject({name: userName});
            });
        });
    });
});
