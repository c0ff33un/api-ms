export const usersTypeDef = `
type User {
    id: Int!
    name: String!
    handle: String!
    email: String!
}

type LoggedUser {
    id: Int!
    name: String!
    handle: String!
    email: String!
    jwt: String!
}

type Room {
    id: String!
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

input RoomInput{
    id: String!
}

`;

export const usersQueries = `
    allUsers: User!
`;

export const usersMutations = `
    signup(user: UserInput!): User!
    login(user: UserLogin!): LoggedUser!
    logout: String!
    confirmation(token: String): User!
    room: Room!
`;
