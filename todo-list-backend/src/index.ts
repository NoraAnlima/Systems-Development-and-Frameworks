import {decode, sign, verify} from "jsonwebtoken";
import {applyMiddleware} from "graphql-middleware";
import {shield, rule, allow} from "graphql-shield";
// normal module import doesn't work :(
const {makeExecutableSchema} = require("graphql-tools");
const {ApolloServer, gql} = require('apollo-server');

import {User} from "./types";
import {InMemoryStorage, IStorage} from "./data"

const typeDefs = gql`
    type User {
        name: String
    }

    type ToDo {
        id: Int
        name: String
        done: Boolean
        assignee: User
    }

    type Query {
        readTodos: [ToDo]!
    }

    type Mutation {
        login(name: String!, password: String!): String
        createTodo(name: String!): ToDo
        updateTodoName(id: Int!, name: String!): ToDo
        updateTodoDone(id: Int!, done: Boolean!): ToDo
        deleteTodo(id: Int!): ToDo
        createUser(name: String! password: String!): User
    }
`;

const resolvers = {
    Query: {
        readTodos: (parent, args, context, info) => {
            let user: User = context.user;
            return storage.readTodos(user);
        },
    },

    Mutation: {
        login: (parent, args, context, info) => {
            let user = storage.readUser(args.name);

            if (!user || !user.checkPassword(args.password)) {
                return null;
            }

            let payload = {
                username: user.name
            };

            return sign(payload, tokenSecret, {expiresIn: "1 day"});
        },
        createTodo: (parent, args, context, info) => {
            let user: User = context.user;
            return storage.createTodo(user, args.name);
        },
        updateTodoName: (parent, args, context, info) => {
            return storage.updateTodoName(context.user, args.id, args.name);
        },
        updateTodoDone: (parent, args, context, info) => {
            return storage.updateTodoDone(context.user, args.id, args.done);
        },
        deleteTodo: (parent, args, context, info) => {
            return storage.deleteTodo(context.user, args.id);
        },
        createUser: (parent, args, context, info) => {
            return storage.createUser(args.name, args.password);
        }
    }
};

const isAuthenticated = rule()(async (parent, args, context, info) => {
    try {
        let token = verify(context.token, tokenSecret);
    }
    catch (e) {
        return false;
    }

    return true;
});

let storage: IStorage = new InMemoryStorage(
    [
        new User("ralph", "ralph"),
        new User("nora", "nora")
    ]
);
let tokenSecret: string = "This is ridiculously good secret!";

const schema = makeExecutableSchema({typeDefs, resolvers});
const permissions = shield(
    {
        Query: {
            "*": isAuthenticated
        },
        Mutation: {
            "*": isAuthenticated,
            login: allow,
        }
    },
    {
        allowExternalErrors: true
    }
);

const finalizedSchema = applyMiddleware(schema, permissions);
const server = new ApolloServer({
    schema: finalizedSchema,
    context: ({req}) => {
        let token: string = req.headers.authorization || "";
        let user: User = null;
        let decodedToken: any = decode(token, {complete: true});
        if (decodedToken) {
            let username = decodedToken.payload.username;
            user = storage.readUser(username);
        }

        return {
            token: token,
            user: user,
        }
    }
});

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`);
});

// todo: add hot reloading
//if (module.hot) {
//    module.hot.accept();
//    module.hot.dispose(() => server.stop());
//}
