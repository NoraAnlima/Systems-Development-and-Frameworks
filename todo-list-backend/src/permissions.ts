import {GraphQLSchema} from "graphql";
import {allow, rule, shield} from "graphql-shield";
import {verify} from "jsonwebtoken";

// todo: what is the exact return type of this function? It atleast is a
//  IMiddlewareGenerator type but the generics are not clear for this one
export function buildPermissions(schema: GraphQLSchema, tokenSecret: string,
                                 debugMode: boolean = false): any {

    const isAuthenticated = rule()(async (parent, args, context, info) => {
        try {
            let token = verify(context.token, tokenSecret);
        } catch (e) {
            return false;
        }

        return true;
    });

    return shield(
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
            allowExternalErrors: debugMode
        }
    );
}
