import {ToDo, User, UserInputError} from "./types";
import {auth, Driver, driver} from "neo4j-driver"
import {appendSuffixesIfMatch} from "ts-loader/dist/utils";

export interface IStorage {
    open(): Promise<void>;

    close(): Promise<void>;

    createUser(name: string, password: string): Promise<User>;

    readUsers(): Promise<Array<User>>;

    readUser(name: string): Promise<User>;

    createTodo(assignee: User, name: string): Promise<ToDo>;

    readTodos(assignee: User): Promise<Array<ToDo>>;

    readTodo(assignee: User, id: number): Promise<ToDo>;

    updateTodo(assignee: User, id: number, newName: string, newDone: boolean): Promise<ToDo>;

    deleteTodo(assignee: User, id: number): Promise<ToDo>;
}

export class InMemoryStorage implements IStorage {

    private readonly todosByUser: Map<string, Array<ToDo>>;
    private readonly userByName: Map<string, User>;

    constructor(initialUsers?: Array<User>, initialTodos?: Array<ToDo>) {
        this.todosByUser = new Map();
        this.userByName = new Map();

        if (initialUsers) {
            for (let user of initialUsers) {
                this.userByName.set(user.name, user);
                this.todosByUser.set(user.name, [])
            }
        }

        if (initialTodos) {
            for (let todo of initialTodos) {
                if (!this.todosByUser.has(todo.assignee.name)) {
                    throw new ReferenceError(
                        `intialTodos contains a user (${todo.assignee}) which is not present in initial users!`);
                }

                this.todosByUser.get(todo.assignee.name).push(todo);
            }
        }
    }

    async createTodo(assignee: User, name: string): Promise<ToDo> {
        if (!this.userByName.has(assignee.name)) {
            return null;  // todo: maybe make this an error?
        }

        let todo = new ToDo(name, assignee);
        this.todosByUser.get(assignee.name).push(todo);

        return todo;
    }

    async createUser(name: string, password: string): Promise<User> {
        if (this.userByName.has(name)) {
            throw new UserInputError(`Username (${name}) is already taken!`);
        }

        let user = new User(name, password);

        this.userByName.set(user.name, user);
        this.todosByUser.set(user.name, []);

        return user;
    }

    async deleteTodo(assignee: User, id: number): Promise<ToDo> {
        let todo = await this.readTodo(assignee, id);

        let newTodos = this.todosByUser.get(assignee.name).filter((t) => t.id !== id);
        this.todosByUser.set(assignee.name, newTodos);

        return todo;
    }

    async readTodo(assignee: User, id: number): Promise<ToDo> {
        let allTodos = await this.readTodos(assignee);
        let todo = allTodos.find((t) => t.id === id);

        if(!todo){
            throw new UserInputError(
                `Todo with id ${id} doesn't exist or is not readable by user ${assignee.name}!`);
        }

        return todo;
    }

    async readTodos(assignee: User): Promise<Array<ToDo>> {
        return [...this.todosByUser.get(assignee.name)];
    }

    async readUser(name: string): Promise<User> {
        if (!this.userByName.has(name)) {
            throw new UserInputError(
                `User with name ${name} doesn't exist!`);
        }

        return this.userByName.get(name);
    }

    async readUsers(): Promise<Array<User>> {
        return Array.from(this.userByName.values());
    }

    async updateTodo(assignee: User, id: number, newName: string, newDone: boolean): Promise<ToDo> {
        let todo = await this.readTodo(assignee, id);

        if (newName !== undefined && newName !== null) {
            todo.name = newName;
        }

        if (newDone !== undefined && newDone !== null) {
            todo.done = newDone;
        }

        return todo;
    }

    async close(): Promise<void> {}

    async open(): Promise<void> {}
}

export class Neo4jStorage implements IStorage {

    // todo: add a close and open function to the interface?

    private readonly driver: Driver;
    private readonly userByName: Map<string, User>;

    constructor(url: string, username: string, password: string, initialUsers?: Array<User>,
                initialTodos?: Array<ToDo>) {

        this.driver = driver(url, auth.basic(username, password));
    }

    async open(): Promise<void> {
        const session = this.driver.session();
        const transaction = session.beginTransaction();

        transaction.run("CREATE CONSTRAINT ON (u:User) ASSERT u.name IS UNIQUE");
        transaction.run("CREATE CONSTRAINT ON (t:ToDo) ASSERT t.id IS UNIQUE");

        try {
            await transaction.commit();
        }
        finally {
            await session.close();
        }
    }

    async close(): Promise<void> {
        await this.driver.close();
    }


    async createTodo(assignee: User, name: string): Promise<ToDo> {
        const session = this.driver.session();
        const todo = new ToDo(name, assignee);

        const query = `
            MATCH (u:User)
            WHERE u.name = $assignee.name
            CREATE (u)-[:ASSIGNED_TO]->(t:ToDo {id: $id, name: $name, done: $done})
        `;

        try {
            await session.run(query, todo.toPlainObj());
        } catch (e) {
            throw new UserInputError(`ToDo (${name}) cannot be created for user ${assignee.name}!`);
        }

        return todo;
    }

    async createUser(name: string, password: string): Promise<User> {
        const session = this.driver.session();
        const user = new User(name, password);

        try {
            await session.run(
                "CREATE (:User {name: $name, hashedPassword: $hashedPassword})",
                user.toPlainObj());
        } catch (e) {
            throw new UserInputError(`Username (${name}) is already taken!`);
        }

        return user;
    }

    async deleteTodo(assignee: User, todoId: number): Promise<ToDo> {
        const session = this.driver.session();

        const deletedTodo = await this.readTodo(assignee, todoId);

        const query = `
            MATCH (u:User {name: $username})-[:ASSIGNED_TO]->(t:ToDo {id: $todoId})
            DETACH DELETE t
            RETURN t
        `;

        try {
            const result = await session.run(
                query,
                {
                    username: assignee.name,
                    todoId: todoId
                });

            const node = result.records[0].get(0);
            return deletedTodo;
        } catch (e) {
            throw new UserInputError(`Todo with ID (${todoId}) does not exist or is not assigned to User (${assignee})!`);
        }
    }

    async readTodo(assignee: User, todoId: number): Promise<ToDo> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)-[:ASSIGNED_TO]->(t:ToDo)
            WHERE t.id = $id AND u.name = $name
            RETURN t
        `;

        try {
            const result = await session.run(query, {id: todoId, name: assignee.name});
            const node = result.records[0].get(0);

            const {id, name, done} = node.properties;
            return new ToDo(name, assignee, id, done);
        } catch (e) {
            throw new UserInputError(`Todo with ID (${todoId}) does not exist or is not assigned to User (${assignee})!`);
        }
    }

    async readTodos(assignee: User): Promise<Array<ToDo>> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)-[:ASSIGNED_TO]->(t:ToDo)
            WHERE u.name = $name
            RETURN t
            ORDER BY t.id
        `;

        try {
            const result = await session.run(query, {name: assignee.name});

            let todos: Array<ToDo> = [];
            for (let i = 0; i < result.records.length; i++) {
                const node = result.records[i].get(0);
                const {id, name, done} = node.properties;
                todos.push(new ToDo(name, assignee, id, done));
            }

            return todos;
        } catch (e) {
            //throw new UserInputError(`Todo with ID (${todoId}) does not exist or is not assigned to User (${assignee})!`);
            throw new UserInputError("a");
        }
    }

    async readUser(username: string): Promise<User> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)
            WHERE u.name = $name
            RETURN u
        `;

        try {
            const result = await session.run(query, {name: username});
            const node = result.records[0].get(0);

            const {name, hashedPassword} = node.properties;
            return new User(name, undefined, hashedPassword);
        } catch (e) {
            throw new UserInputError(`Name (${username}) is already taken!`);
        }
    }

    async readUsers(): Promise<Array<User>> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)
            WHERE u.name = $name
            RETURN u
            ORDER BY u.name
        `;

        try {
            const result = await session.run(query, {name});

            let users: Array<User> = [];
            for (let i = 0; i < result.records.length; i++) {
                const node = result.records[i].get(0);
                const {username, hashedPassword} = node.properties;
                users.push(new User(username, undefined, hashedPassword));
            }

            return users;
        } catch (e) {
            throw new UserInputError(`Username (${name}) is already taken!`);
        }
    }

    async updateTodo(assignee: User, todoId: number, newName: string, newDone: boolean): Promise<ToDo> {
        const session = this.driver.session();

        const oldTodo = await this.readTodo(assignee, todoId);

        if (newName === undefined && newDone === undefined) {
            return oldTodo;
        }

        if (newName === undefined) {
            newName = oldTodo.name;
        }

        if (newDone === undefined) {
            newDone = oldTodo.done;
        }

        const query = `
            MATCH (u:User {name: $username})
            MATCH (t:ToDo {id: $todoId})
            MERGE (u)-[:ASSIGNED_TO]->(t)
            SET t.name = $newName, t.done = $newDone
            RETURN t
        `;

        try {
            const result = await session.run(
                query,
                {
                    username: assignee.name,
                    todoId: todoId,
                    newName: newName,
                    newDone: newDone
                });

            const node = result.records[0].get(0);

            const {id, name, done} = node.properties;
            return new ToDo(name, assignee, id, done);
        } catch (e) {
            throw new UserInputError(`Todo with ID (${todoId}) does not exist or is not assigned to User (${assignee})!`);
        }
    }
}
