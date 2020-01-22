import {buildApolloServer} from "../../src";
import {InMemoryStorage, IStorage, Neo4jStorage} from "../../src/data";
import {User, ToDo, DataAccessError} from "../../src/types";
import {ApolloServerTestClient, createTestClient} from "apollo-server-testing";
import {ApolloServer, gql} from "apollo-server";
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

const UPDATE_TODO = gql`
    mutation UpdateTodoName($id: Int!, $name: String, $done: Boolean) {
        updateTodo(id: $id, name: $name, done: $done) {
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

async function buildTwoUserStorage(addTodos: boolean = false, inMemory: boolean): Promise<IStorage> {
    let neo4jArgs: [string, string, string] = ["bolt://localhost:7687", "neo4j", "test"];
    let storage = inMemory ? new InMemoryStorage() : new Neo4jStorage(...neo4jArgs);

    if (!inMemory) {
        await storage.clearStorage();
    }

    let rawUsers = [
        {name: "ralph", password: "ralph"},
        {name: "nora", password: "nora"}
    ];

    let users: Array<User> = [];
    for (let plainUser of rawUsers) {
        users.push(await storage.createUser(plainUser.name, plainUser.password));
    }

    if (addTodos) {
        let rawTodos = [
            {name: "first todo", assignee: users[1]},
            {name: "second todo", assignee: users[0]},
        ];

        for (let todo of rawTodos) {
            await storage.createTodo(todo.assignee, todo.name);
        }

    }

    return storage;
}

async function serverSetup(addTodos: boolean, authorizeUser: boolean, inMemoryStorage: boolean) {
    const authSecret: string = "This is a perfect secret for testing!";
    let storage = await buildTwoUserStorage(addTodos, inMemoryStorage);

    let user = await storage.readUser("ralph");
    let context;
    if (authorizeUser) {
        let token = sign({username: user.name}, authSecret, {expiresIn: "1 day"});
        context = {token: token, user: user};
    } else {
        context = {token: "I'm not a valid token"};
    }

    let testServer = buildApolloServer(
        storage,
        authSecret,
        false,
        context);

    let {query, mutate} = createTestClient(testServer);

    return {testServer, storage, user, query, mutate};
}

describe("InMemoryStorage", () => {
    describe("query", queryTests.bind(null, true));
    describe("mutate", mutationTests.bind(null, true));
});

describe("Neo4jStorage", () => {
    describe("query", queryTests.bind(null, false));
    describe("mutate", mutationTests.bind(null, false));
});

function queryTests(inMemoryStorage: boolean) {
    let server: ApolloServer;
    let user: User;
    let storage: IStorage;
    let query: any;
    let mutate: any;

    describe("given a legit authorization token", () => {
        beforeEach(async () => {
            let setup = await serverSetup(true, true, inMemoryStorage);
            server = setup.testServer;
            storage = setup.storage;
            user = setup.user;
            query = setup.query;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
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
            let setup = await serverSetup(true, false, inMemoryStorage);
            server = setup.testServer;
            storage = setup.storage;
            user = setup.user;
            query = setup.query;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
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
}

function mutationTests(inMemoryStorage: boolean) {
    describe("given correct user credentials", () => {
        let mutate: any;
        let server: ApolloServer;
        let storage: IStorage;

        beforeEach(async () => {
            let setup = await serverSetup(false, true, inMemoryStorage);
            storage = setup.storage;
            server = setup.testServer;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
        });

        describe("login", () => {
            it("returns a jwt", async () => {
                let tokenResponse = await mutate({
                    mutation: LOGIN,
                    variables: {
                        name: "ralph",
                        password: "ralph"
                    }
                });

                expect(tokenResponse.data.login).toEqual(expect.any(String));
            });
        });
    });

    describe("given wrong user credentials", () => {
        let mutate: any;
        let server: ApolloServer;
        let storage: IStorage;

        beforeEach(async () => {
            let setup = await serverSetup(false, true, inMemoryStorage);
            storage = setup.storage;
            server = setup.testServer;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
        });

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
        let server: ApolloServer;
        let storage: IStorage;
        let query: any;
        let mutate: any;

        beforeEach(async () => {
            let setup = await serverSetup(false, true, inMemoryStorage);
            server = setup.testServer;
            storage = setup.storage;
            user = setup.user;
            query = setup.query;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
        });

        describe("createTodo", () => {
            it("adds the new todo into storage", async () => {
                expect(await storage.readTodos(user)).toHaveLength(0);

                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(await storage.readTodos(user)).toHaveLength(1);
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
                todo = await storage.readTodo(user, response.data.createTodo.id);
            });

            describe("updateTodoName", () => {
                it("changes the todo in storage", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todo.id, name: "updated todo"}
                    });

                    let changedTodo = await storage.readTodo(user, todo.id);

                    expect(changedTodo.name).toBe("updated todo");
                });

                it("returns the changed todo", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todo.id, name: "updated todo"}
                    });

                    expect(response.data.updateTodo).toMatchObject({name: "updated todo"});
                });

                it("returns null on invalid id", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: -10, name: "should not work"}
                    });

                    expect(response.data.updateTodo).toBeNull();
                });
            });

            describe("updateTodoDone", () => {
                it("changes the todo in storage", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todo.id, done: true}
                    });

                    let changedTodo = await storage.readTodo(user, todo.id);

                    expect(changedTodo.done).toBeTruthy();
                });

                it("returns the changed todo", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todo.id, done: true}
                    });

                    expect(response.data.updateTodo).toMatchObject({done: true});
                });

                it("returns null on invalid id", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: -10, done: true}
                    });

                    expect(response.data.updateTodo).toBeNull();
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

                    await expect(storage.readTodo(user, todo.id)).rejects.toThrow(Error);
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
                otherUser = await storage.readUser("nora");
                todoFromOtherUser = await storage.createTodo(otherUser, "my todo is protected");
            });

            describe("updateTodoName", () => {
                it("returns null", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todoFromOtherUser.id, name: "new todo name"}
                    });

                    expect(response.data.updateTodo).toBeNull();
                });

                it("doesn't change the todo in storage", async () => {
                    let oldTodoName = (await storage.readTodo(otherUser, todoFromOtherUser.id)).name;

                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todoFromOtherUser.id, name: "new todo name"}
                    });

                    let notChangedTodo = await storage.readTodo(otherUser, todoFromOtherUser.id);

                    expect(notChangedTodo.name).toEqual(oldTodoName);
                });
            });

            describe("updateTodoDone", () => {
                it("returns null", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todoFromOtherUser.id, done: true}
                    });

                    expect(response.data.updateTodo).toBeNull();
                });

                it("doesn't change the todo in storage", async () => {
                    let response = await mutate({
                        mutation: UPDATE_TODO,
                        variables: {id: todoFromOtherUser.id, done: true}
                    });

                    let notChangedTodo = await storage.readTodo(otherUser, todoFromOtherUser.id);

                    expect(notChangedTodo.done).toBeFalsy();
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

                await expect(storage.readUser(userName)).resolves.toMatchObject({name: userName});
            });
        });
    });

    describe("given a random authorization token", () => {
        let storage: IStorage;
        let server: ApolloServer;
        let query: any;
        let mutate: any;

        beforeEach(async () => {
            let setup = await serverSetup(true, false, inMemoryStorage);
            server = setup.testServer;
            storage = setup.storage;
            query = setup.query;
            mutate = setup.mutate;
        });

        afterEach(async () => {
            await server.stop();
            await storage.close();
        });

        describe("createTodo", () => {
            it("raises an error", async () => {
                let response = await mutate({
                    mutation: CREATE_TODO,
                    variables: {
                        name: "new todo"
                    }
                });

                expect(response).toMatchObject({errors: [{message: "Not Authorised!"}]});
                expect(response.data.createTodo).toBeNull();
            });
        });

        describe("updateTodoName", () => {
            it("raises an error", async () => {
                let userWithTodo = await storage.readUser("nora");
                let todoToChange = (await storage.readTodos(userWithTodo))[0];

                let response = await mutate({
                    mutation: UPDATE_TODO,
                    variables: {
                        id: todoToChange.id,
                        name: "new todo name"
                    }
                });

                expect(response).toMatchObject({errors: [{message: "Not Authorised!"}]});
                expect(response.data.updateTodo).toBeNull();
            });
        });

        describe("updateTodoDone", () => {
            it("raises an error", async () => {
                let userWithTodo = await storage.readUser("nora");
                let [todoToChange] = await storage.readTodos(userWithTodo);

                let response = await mutate({
                    mutation: UPDATE_TODO,
                    variables: {
                        id: todoToChange.id,
                        done: true
                    }
                });

                expect(response).toMatchObject({errors: [{message: "Not Authorised!"}]});
                expect(response.data.updateTodo).toBeNull();
            });
        });

        describe("deleteTodo", () => {
            it("raises an error", async () => {
                let userWithTodo = await storage.readUser("nora");
                let todoToDelete = (await storage.readTodos(userWithTodo))[0];

                let response = await mutate({
                    mutation: DELETE_TODO,
                    variables: {
                        id: todoToDelete.id
                    }
                });

                expect(response).toMatchObject({errors: [{message: "Not Authorised!"}]});
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

                expect(await storage.readUser(userName)).toMatchObject({name: userName});
            });
        });
    });
}
