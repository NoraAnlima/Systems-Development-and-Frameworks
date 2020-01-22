import {compareSync, hashSync} from "bcrypt";

export class User {
    private static readonly noSaltRounds: number = 10;

    private readonly _hashedPassword: string;
    private _name: string;

    constructor(name: string, password?: string, hashedPassword?: string) {
        this._name = name;
        if (hashedPassword) {
            this._hashedPassword = hashedPassword;
        }
        else {
            this._hashedPassword = hashSync(password, User.noSaltRounds);
        }
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    private get hashedPassword(): string {
        return this._hashedPassword;
    }

    public checkPassword(password: string): boolean {
        return compareSync(password, this.hashedPassword);
    }

    public toPlainObj(): {name: string, hashedPassword: string} {
        return {name: this.name, hashedPassword: this.hashedPassword};
    }
}

export class ToDo {
    private static lastUsedId: number = 0;

    private readonly _id: number;
    private _assignee: User;
    private _name: string;
    private _done: boolean;

    public static overrideLastUsedId(lastUsedId: number) {
        ToDo.lastUsedId = lastUsedId;
    }

    constructor(name: string, assignee: User, id?: number, done?: boolean) {
        this._name = name;
        this._assignee = assignee;
        this._id = id !== undefined ? id : ToDo.lastUsedId++;
        this._done = done !== undefined ? done : false;
    }

    get id(): number {
        return this._id;
    }

    get assignee(): User {
        return this._assignee;
    }

    set assignee(value: User) {
        this._assignee = value;
    }

    get done(): boolean {
        return this._done;
    }

    set done(value: boolean) {
        this._done = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    public toPlainObj(): {id: number, assignee: {name: string, hashedPassword: string}, name: string, done: boolean} {
        return {
            id: this.id,
            assignee: this.assignee.toPlainObj(),
            name: this.name,
            done: this.done
        };
    }
}

export class DataAccessError extends Error {
    private _message: string;

    constructor(message: string, ...args: any[]) {
        super(...args);
        this._message = message;
    }

    get message(): string {
        return this._message;
    }
}

export class AuthorizationError extends Error {
    private _message: string;

    constructor(message: string, ...args: any[]) {
        super(...args);
        this._message = message;
    }

    get message(): string {
        return this._message;
    }
}
