export const usersTypeDef = `
type User {
    id: Int!
    handle: String!
    email: String!
    guest: Boolean!
}

type LoggedUser {
    user: User!
    jwt: String!
}

type Exit{
    x: Int!
    y: Int!
}

type Dimension{
    w: Int!
    h: Int!
}

type Room {
    id: String!
}

type Grid {
    seed: String!
    matrix: [Boolean]!
    exit: Exit!
    size: Dimension!
}

type LogoutMsg {
    msg: String
}

input UserInput {
    handle: String!
    email: String!
    password: String!
}

input UserLogin {
    email: String!
    password: String!
}

input GridInput{
    seed: String!
    w: String
    h: String
}

`;

export const usersQueries = `
    allUsers: User!
    user: User!
`;

export const usersMutations = `
    signup(user: UserInput!): User!
    login(user: UserLogin!): LoggedUser!
    guest: LoggedUser!
    logout: LogoutMsg!
    confirmation(token: String! ): User!
    room: Room!
    grid(settings: GridInput!): Grid!
`;
