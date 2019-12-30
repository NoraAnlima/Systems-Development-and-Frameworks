import {ToDo, User, UserInputError} from "./types";

export interface IStorage {
    createUser(name: string, password: string): User;

    readUsers(): Array<User>;

    readUser(name: string): User;

    createTodo(assignee: User, name: string): ToDo;

    readTodos(assignee: User): Array<ToDo>;

    readTodo(assignee: User, id: number): ToDo;

    updateTodo(assignee: User, id: number, newName: string, newDone: boolean): ToDo;

    deleteTodo(assignee: User, id: number): ToDo;
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

    createTodo(assignee: User, name: string): ToDo {
        if (!this.userByName.has(assignee.name)) {
            return null;
        }

        let todo = new ToDo(name, assignee);
        this.todosByUser.get(assignee.name).push(todo);

        return todo;
    }

    createUser(name: string, password: string): User {
        if (this.userByName.has(name)) {
            throw new UserInputError(`Username (${name}) is already taken!`);
        }

        let user = new User(name, password);

        this.userByName.set(user.name, user);
        this.todosByUser.set(user.name, []);

        return user;
    }

    deleteTodo(assignee: User, id: number): ToDo {
        let todo = this.readTodo(assignee, id);

        if (!todo) {
            return null;
        }

        let newTodos = this.todosByUser.get(assignee.name).filter((t) => t.id !== id);
        this.todosByUser.set(assignee.name, newTodos);

        return todo;
    }

    readTodo(assignee: User, id: number): ToDo {
        let todo = this.readTodos(assignee).find((t) => t.id === id);

        if(!todo){
            return null;
        }

        return todo;
    }

    readTodos(assignee: User): Array<ToDo> {
        return [...this.todosByUser.get(assignee.name)];
    }

    readUser(name: string): User {
        if (!this.userByName.has(name)) {
            return null;
        }

        return this.userByName.get(name);
    }

    readUsers(): Array<User> {
        return Array.from(this.userByName.values());
    }

    updateTodo(assignee: User, id: number, newName: string, newDone: boolean): ToDo {
        let todo = this.readTodo(assignee, id);

        if (!todo) {
            return null;
        }

        if (newName !== undefined && newName !== null) {
            todo.name = newName;
        }

        if (newDone !== undefined && newDone !== null) {
            todo.done = newDone;
        }

        return todo;
    }
}

