import {compareSync, hashSync} from "bcrypt";

export class User {
    private static readonly noSaltRounds: number = 10;

    private readonly _hashedPassword: string;
    private _name: string;

    constructor(name: string, password: string) {
        this._hashedPassword = hashSync(password, User.noSaltRounds);
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    public checkPassword(password: string): boolean {
        return compareSync(password, this._hashedPassword);
    }
}

export class ToDo {
    private static lastUsedId: number = 0;

    private readonly _id: number;
    private _assignee: User;
    private _name: string;
    private _done: boolean;

    constructor(name: string, assignee: User) {
        this._id = ToDo.lastUsedId++;
        this._assignee = assignee;
        this._name = name;
        this._done = false;
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
}
