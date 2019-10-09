export const usersTypeDef = `
type User {
    id: Int!
    name: String!
    handle: String!
    email: String!
}

input UserInput {
    name: String!
    handle: String!
    email: String!
    password: String!
}

input UserLogin {
    email: String!
    password: String!
}
`;

export const usersQueries = `
    allUsers: [User]!
    
`;

export const usersMutations = `
    signUp(user: UserInput!): User!
    logIn(user: UserLogin!): User!
`;
