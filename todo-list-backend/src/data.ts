import {ToDo, User, DataAccessError, AuthorizationError} from "./types";
import {auth, Driver, driver} from "neo4j-driver"

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

    clearStorage(): Promise<void>;
}

export class InMemoryStorage implements IStorage {

    private readonly todosByUser: Map<string, Array<ToDo>>;
    private readonly userByName: Map<string, User>;

    constructor() {
        this.todosByUser = new Map();
        this.userByName = new Map();
    }

    async clearStorage(): Promise<void> {
        this.todosByUser.clear();
        this.userByName.clear();
    }

    async createTodo(assignee: User, name: string): Promise<ToDo> {
        if (!this.userByName.has(assignee.name)) {
            throw new AuthorizationError(`User (${assignee.name}) doesn't exist!`)
        }

        let todo = new ToDo(name, assignee);
        this.todosByUser.get(assignee.name).push(todo);

        return todo;
    }

    async createUser(name: string, password: string): Promise<User> {
        if (this.userByName.has(name)) {
            throw new DataAccessError(`Username (${name}) is already taken!`);
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
            throw new DataAccessError(
                `Todo with id ${id} doesn't exist or is not readable by user ${assignee.name}!`);
        }

        return todo;
    }

    async readTodos(assignee: User): Promise<Array<ToDo>> {
        return [...this.todosByUser.get(assignee.name)];
    }

    async readUser(name: string): Promise<User> {
        if (!this.userByName.has(name)) {
            throw new DataAccessError(
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

    private readonly driver: Driver;

    constructor(url: string, username: string, password: string) {
        this.driver = driver(url, auth.basic(username, password));
    }

    async clearStorage(): Promise<void> {
        const session = this.driver.session();

        await session.run(`
            MATCH (n)
            OPTIONAL MATCH (n)-[r]-()
            DELETE n,r`);

        await session.close();
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
            throw new DataAccessError(`ToDo (${name}) cannot be created for user ${assignee.name}!`);
        }
        finally {
            await session.close();
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
            throw new DataAccessError(`Username ${name} is already taken!`);
        }
        finally {
            await session.close();
        }

        return user;
    }

    async deleteTodo(assignee: User, todoId: number): Promise<ToDo> {
        const session = this.driver.session();

        const deletedTodo = await this.readTodo(assignee, todoId);

        const query = `
            MATCH (u:User {name: $username})-[:ASSIGNED_TO]->(t:ToDo {id: $todoId})
            DETACH DELETE t
            RETURN t {.*}
        `;

        try {
            const result = await session.run(
                query,
                {
                    username: assignee.name,
                    todoId: todoId
                });

            const node = result.records[0].get(0); // todo: return node here?
            return deletedTodo;
        } catch (e) {
            throw new DataAccessError(`Todo with ID ${todoId} does not exist or is not assigned to User ${assignee}!`);
        }
        finally {
            await session.close();
        }
    }

    async readTodo(assignee: User, todoId: number): Promise<ToDo> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)-[:ASSIGNED_TO]->(t:ToDo)
            WHERE t.id = $id AND u.name = $name
            RETURN t {.*}
        `;

        try {
            const result = await session.run(query, {id: todoId, name: assignee.name});
            const {id, name, done} = result.records[0].get(0);
            return new ToDo(name, assignee, id, done);
        } catch (e) {
            throw new DataAccessError(`Todo with ID ${todoId} does not exist or is not assigned to User ${assignee}!`);
        }
        finally {
            await session.close();
        }
    }

    async readTodos(assignee: User): Promise<Array<ToDo>> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)-[:ASSIGNED_TO]->(t:ToDo)
            WHERE u.name = $name
            RETURN t {.*}
            ORDER BY t.id
        `;

        try {
            const result = await session.run(query, {name: assignee.name});
            return result.records.map(record => {
                const { id, name, done } = record.get('t');
                return new ToDo(name, assignee, id, done)
            })
        } catch (e) {
            throw new DataAccessError(`Read todos failed for user ${assignee}!`);
        }
        finally {
            await session.close();
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
            throw new DataAccessError(`Read user failed for username ${username}!`);
        }
        finally {
            await session.close();
        }
    }

    async readUsers(): Promise<Array<User>> {
        const session = this.driver.session();

        const query = `
            MATCH (u:User)
            WHERE u.name = $name
            RETURN u {.*}
            ORDER BY u.name
        `;

        try {
            const result = await session.run(query, {name});

            return result.records.map(record => {
                const { username, hashedPassword } = record.get('t');
                return new User(username, undefined, hashedPassword)
            })
        } catch (e) {
            throw new DataAccessError(`Read users failed!`);
        }
        finally {
            await session.close();
        }
    }

    async updateTodo(assignee: User, todoId: number, newName: string, newDone: boolean): Promise<ToDo> {
        const session = this.driver.session();

        const oldTodo = await this.readTodo(assignee, todoId);

        if (!(newName || newDone !== undefined)) {
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
                    todoId,
                    newName,
                    newDone
                });

            const node = result.records[0].get(0);

            const {id, name, done} = node.properties;
            return new ToDo(name, assignee, id, done);
        } catch (e) {
            throw new DataAccessError(`Todo with ID ${todoId} does not exist or is not assigned to User ${assignee}!`);
        }
        finally {
            await session.close();
        }
    }
}
