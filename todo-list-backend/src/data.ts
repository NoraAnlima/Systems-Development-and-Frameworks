import {ToDo, User, UserInputError} from "./types";
import {auth, Driver, driver} from "neo4j-driver"

export interface IStorage {
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
}

//export class Neo4jStorage implements IStorage {
//
//    // todo: add a close and open function to the interface?
//
//    private readonly driver: Driver;
//    private readonly userByName: Map<string, User>;
//
//    constructor(url: string, username: string, password: string, initialUsers?: Array<User>,
//                initialTodos?: Array<ToDo>) {
//
//        this.driver = driver(url, auth.basic(username, password));
//
//        const session = this.driver.session();
//
//        const constraints = [
//            session.run("CREATE CONSTRAINT ON (u:User) ASSERT u.name IS UNIQUE"),
//            session.run("CREATE CONSTRAINT ON (t:ToDo) ASSERT t.id IS UNIQUE")
//        ];
//
//        Promise.all(constraints).then(values => {
//            // todo: is this the correct way?
//            session.close()
//        });
//    }
//
//    createTodo(assignee: User, name: string): ToDo {
//        return null;
//    }
//
//    async createUser(name: string, password: string): Promise<User> {
//
//        const session = this.driver.session();
//
//        // todo: check if user already exists
//
//        const user = new User(name, password);
//
//        try {
//            await session.run(
//                "CREATE (:User {name: $name, hashedPassword: $hashedPassword})",
//                user.toPlainObj());
//        } catch (e) {
//            throw new UserInputError(`Username (${name}) is already taken!`);
//        }
//
//        return user;
//    }
//
//    deleteTodo(assignee: User, id: number): ToDo {
//        return null;
//    }
//
//    readTodo(assignee: User, id: number): ToDo {
//        return null;
//    }
//
//    readTodos(assignee: User): Array<ToDo> {
//        return null;
//    }
//
//    readUser(name: string): User {
//        return null;
//    }
//
//    readUsers(): Array<User> {
//        return null;
//    }
//
//    updateTodo(assignee: User, id: number, newName: string, newDone: boolean): ToDo {
//        return null;
//    }
//}
