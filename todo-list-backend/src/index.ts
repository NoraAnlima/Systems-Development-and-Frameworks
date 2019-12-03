import {decode, sign} from "jsonwebtoken";
import {applyMiddleware} from "graphql-middleware";
import {ApolloServer, gql} from "apollo-server";
import {makeExecutableSchema} from "graphql-tools";

import {User} from "./types";
import {InMemoryStorage, IStorage} from "./data"
import {buildPermissions} from "./permissions";

let storage: IStorage = new InMemoryStorage(
    [
        new User("ralph", "ralph"),
        new User("nora", "nora")
    ]
);
let authSecret: string = "This is a ridiculously good secret!";

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
        readTodos: (parent: any, args: any, context: any, info: any) => {
            let user: User = context.user;
            return storage.readTodos(user);
        },
    },

    Mutation: {
        login: (parent: any, args: any, context: any, info: any) => {
            let user = storage.readUser(args.name);

            if (!user || !user.checkPassword(args.password)) {
                return null;
            }

            let payload = {
                username: user.name
            };

            return sign(payload, authSecret, {expiresIn: "1 day"});
        },
        createTodo: (parent: any, args: any, context: any, info: any) => {
            let user: User = context.user;
            return storage.createTodo(user, args.name);
        },
        updateTodoName: (parent: any, args: any, context: any, info: any) => {
            return storage.updateTodoName(context.user, args.id, args.name);
        },
        updateTodoDone: (parent: any, args: any, context: any, info: any) => {
            return storage.updateTodoDone(context.user, args.id, args.done);
        },
        deleteTodo: (parent: any, args: any, context: any, info: any) => {
            return storage.deleteTodo(context.user, args.id);
        },
        createUser: (parent: any, args: any, context: any, info: any) => {
            return storage.createUser(args.name, args.password);
        }
    }
};

export function buildApolloServer(storage: IStorage, authSecret: string,
                                  debugMode: boolean = false): ApolloServer {

    const schema = makeExecutableSchema({typeDefs, resolvers});
    const permissions = buildPermissions(schema, authSecret, debugMode);
    const finalizedSchema = applyMiddleware(schema, permissions);

    return new ApolloServer({
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
}

const server = buildApolloServer(storage, authSecret);
server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`);
});

// todo: add hot reloading
//if (module.hot) {
//    module.hot.accept();
//    module.hot.dispose(() => server.stop());
//}
