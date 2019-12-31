import {decode, sign, verify} from "jsonwebtoken";
import {applyMiddleware} from "graphql-middleware";
import {ApolloServer, gql} from "apollo-server";
import {makeExecutableSchema} from "graphql-tools";

import {User} from "./types";
import {InMemoryStorage, IStorage} from "./data"
import {buildPermissions} from "./permissions";

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
        updateTodo(id: Int!, name: String, done: Boolean): ToDo
        deleteTodo(id: Int!): ToDo
        createUser(name: String! password: String!): User
    }
`;

function buildResolvers(storage: IStorage, authSecret: string): any {
    return {
        Query: {
            readTodos: async (parent: any, args: any, context: any, info: any) => {
                let user: User = context.user;
                return await storage.readTodos(user);
            },
        },

        Mutation: {
            login: async (parent: any, args: any, context: any, info: any) => {
                let user = await storage.readUser(args.name);

                if (!user || !user.checkPassword(args.password)) {
                    return null;
                }

                let payload = {
                    username: user.name
                };

                return sign(payload, authSecret, {expiresIn: "1 day"});
            },
            createTodo: async (parent: any, args: any, context: any, info: any) => {
                let user: User = context.user;
                return await storage.createTodo(user, args.name);
            },
            updateTodo: async (parent: any, args: any, context: any, info: any) => {
                return await storage.updateTodo(context.user, args.id, args.name, args.done);
            },
            deleteTodo: async (parent: any, args: any, context: any, info: any) => {
                return await storage.deleteTodo(context.user, args.id);
            },
            createUser: async (parent: any, args: any, context: any, info: any) => {
                return await storage.createUser(args.name, args.password);
            }
        }
    }
}

export function buildApolloServer(storage: IStorage, authSecret: string,
                                  debugMode: boolean = false, context?: any): ApolloServer {

    const resolvers = buildResolvers(storage, authSecret);
    const schema = makeExecutableSchema({typeDefs, resolvers});
    const permissions = buildPermissions(schema, authSecret, debugMode);
    const finalizedSchema = applyMiddleware(schema, permissions);

    return new ApolloServer({
        schema: finalizedSchema,
        context: async ({req}) => {
            if (context) {
                return context;
            }

            let token: string = req.headers.authorization || "";
            let user: User = null;
            let decodedToken: any = verify(token, authSecret, {complete: true});
            if (decodedToken) {
                let username = decodedToken.payload.username;
                user = await storage.readUser(username);
            }

            return {
                token: token,
                user: user,
            }
        }
    });
}

if (require.main === module) {
    let storage: IStorage = new InMemoryStorage();
    let authSecret: string = "This is a ridiculously good secret!";

    const server = buildApolloServer(storage, authSecret);
    server.listen().then(({url}) => {
        console.log(`Server ready at ${url}`);
    });

// todo: add hot reloading
//if (module.hot) {
//    module.hot.accept();
//    module.hot.dispose(() => server.stop());
//}
}
