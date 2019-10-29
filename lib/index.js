'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Koa = _interopDefault(require('koa'));
var KoaRouter = _interopDefault(require('koa-router'));
var koaLogger = _interopDefault(require('koa-logger'));
var koaBody = _interopDefault(require('koa-bodyparser'));
var koaCors = _interopDefault(require('@koa/cors'));
var apolloServerKoa = require('apollo-server-koa');
var merge = _interopDefault(require('lodash.merge'));
var GraphQLJSON = _interopDefault(require('graphql-type-json'));
var graphqlTools = require('graphql-tools');
var request = _interopDefault(require('request-promise-native'));
var graphql = require('graphql');

/**
 * Creates a request following the given parameters
 * @param {string} url
 * @param {string} method
 * @param {object} [body]
 * @param {boolean} [fullResponse]
 * @return {Promise.<*>} - promise with the error or the response object
 */
async function generalRequest(url, method, body, fullResponse, headers) {
	const parameters = {
		method,
		uri: encodeURI(url),
		body,
		json: true,
		resolveWithFullResponse: fullResponse,
		headers,		
	};
	if (process.env.SHOW_URLS) {
		// eslint-disable-next-line
		console.log(url);
	}

	try {
		return await request(parameters);
	} catch (err) {
		return err;
	}
}

/**
 * Adds parameters to a given route
 * @param {string} url
 * @param {object} parameters
 * @return {string} - url with the added parameters
 */


/**
 * Generates a GET request with a list of query params
 * @param {string} url
 * @param {string} path
 * @param {object} parameters - key values to add to the url path
 * @return {Promise.<*>}
 */


/**
 * Merge the schemas in order to avoid conflicts
 * @param {Array<string>} typeDefs
 * @param {Array<string>} queries
 * @param {Array<string>} mutations
 * @return {string}
 */
function mergeSchemas(typeDefs, queries, mutations) {
	return `${typeDefs.join('\n')}
    type Query { ${queries.join('\n')} }
    type Mutation { ${mutations.join('\n')} }`;
}

function formatErr(error) {
	const data = graphql.formatError(error);
	const { originalError } = error;
	if (originalError && originalError.error) {
		const { path } = data;
		const { error: { id: message, code, description } } = originalError;
		return { message, code, description, path };
	}
	return data;
}

const usersTypeDef = `
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

const usersQueries = `
    allUsers: User!
    user: User!
`;

const usersMutations = `
    signup(user: UserInput!): User!
    login(user: UserLogin!): LoggedUser!
    guest: LoggedUser!
    logout: LogoutMsg!
    confirmation(token: String! ): User!
    room: Room!
    grid(settings: GridInput!): Grid!
`;

const auth_url = process.env.AUTH_URL;
const data_url = process.env.DATA_URL;    
const match_url = process.env.MATCH_URL;  
const game_url = process.env.GAME_URL;
const grid_url = process.env.GRID_URL;

const AUTH_URL = `http://${auth_url}`;
const DATA_URL = `http://${data_url}`;
const MATCH_URL = `http://${match_url}`;
const GRID_URL = `http://${grid_url}`;
const GAME_URL = `http://${game_url}`;

const resolvers = {
	Query: {
		allUsers: (_) =>
			generalRequest(`${DATA_URL}/graphql?query=\{users \{id handle email matches\{id\} won\{id\}\}\}`,'GET',{}),
		user: (root,args,context) => 
			generalRequest(`${AUTH_URL}/user`,'GET',{},true,{"Authorization": `Bearer ${context.token}`})
				.then(res => {
					console.log(res);

					if(res.statusCode != 200 || res.statusCode == 201){
						return new Error(res.message)
					}
					
					return res.body
				})
				.catch(err => new Error(err))
	},

	Mutation: {
		signup: (_, { user }) => 
			generalRequest(`${AUTH_URL}/signup`, 'POST', { user }, true)
			 .then(res => {
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
				if(res.statusCode != 201){
					return new Error(res.message)
				}

				return res.body
			})
			.catch(err => new Error(err))
		,
		confirmation: (_, { token }) => 
				generalRequest(`${AUTH_URL}/confirmation?confirmation_token=${token}`, 'GET', {}, true)
					.then(async res => {
						console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
						if(res.statusCode != 200){
							return new Error(res.message)
						}

						const {id, handle, email} = res.body;
						await generalRequest(`${DATA_URL}/graphql`,'POST', { query: `mutation{ addUser(authId:${id},handle: "${handle}", email:"${email}"){authId}}`});
						await generalRequest(`${MATCH_URL}/create`,'POST', { userid: Number(`${id}`)});
						return res.body
					})
					.catch(err => new Error(err))
		,
		login: (_, { user }) => 
			generalRequest(`${AUTH_URL}/login`, 'POST', { user }, true)
				.then(res => {
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
					if(res.statusCode != 201){
						return new Error(res.message)
					}

					const data = res.body, jwt = res.headers.authorization.split(" ")[1];

					return {
						user: data,
						jwt
					}
				})
				.catch(err => new Error(err))
		,
		guest: (_, { }) => 
		generalRequest(`${AUTH_URL}/guests`, 'POST', { }, true)
			.then(res => {
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
				if(res.statusCode != 200){
					return new Error(res.message)
				}

				const data = res.body, jwt = res.headers.authorization.split(" ")[1];

				return {
					user: data,
					jwt,
				}
			})
			.catch(err => new Error(err))
	,
		logout: (_, {}, context) => {
			if(!context.token){
				return new Error("401 UNAUTHORIZED")
			}

			return generalRequest(`${AUTH_URL}/logout`, 'DELETE', {}, true, {"Authorization": `Bearer ${context.token}`})
			.then(async res => {
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");

				if(res.statusCode != 204){
					return new Error(res.message)
				}

				return {
					msg: res.statusMessage
				}
			})
			.catch(err => new Error(err))
		},
		room: (_, {}, context) => {
			if(!context.token){
				return new Error("401 NO TOKEN FOUND")
			}

			return request({
				uri: encodeURI(`${AUTH_URL}/user`),
				method: 'GET',
				headers: {'Authorization': `Bearer ${context.token}`},
				json: true
			})
				.then(res => {
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
					if(!res.id){
						console.log(res);
						return new Error("401 UNAUTHORIZED")
					}

					const createRoom = generalRequest(`${GAME_URL}/room`, 'POST');

					return Promise.all([createRoom])
						.then(res => {
							const room_info = res[0];

							console.log(room_info);
							return {
								id: room_info.id
							}
						})
						.catch(err => new Error(err))
				})
				.catch(err => new Error(err))
		},
		grid: (_, { settings }, context) => {
			if(!context.token){
				return new Error("401 NO TOKEN FOUND")
			}

			return request({
				uri: encodeURI(`${AUTH_URL}/user`),
				method: 'GET',
				headers: {'Authorization': `Bearer ${context.token}`},
				json: true
			})
				.then(res => {
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n");
					if(!res.id){
						console.log(res);
						return new Error("401 UNAUTHORIZED")
					}

					const generateGrid = generalRequest(`${GRID_URL}/grid?seed=${Number(settings.seed)}${settings.w?`&width=${settings.w}`:""}${settings.h?`&height=${settings.h}`:""}`, '');
					const saveGridInAGame = generalRequest(`${DATA_URL}/graphql`,'POST',{query:`mutation {addGame(seed: \"${settings.seed}\"){id seed}}`});

					return Promise.all([generateGrid,saveGridInAGame])
						.then(res => {
							const grid_info = res[0], game_info = res[1].data.addGame;
							let matrix = [];
							
							grid_info.matrix.forEach(row => {
								row.forEach(item => {
									matrix.push(item);
								});
							});

							console.log(grid_info,game_info);
							return {
								seed: settings.seed,
								matrix,
								exit: {
									x:grid_info.exit.first, 
									y:grid_info.exit.second,
								},
								size:{
									w: grid_info.m,
									h: grid_info.n,
								}
							}
						})
						.catch(err => new Error(err))
				})
				.catch(err => new Error(err))
		},
	}
};

// merge the typeDefs
const mergedTypeDefs = mergeSchemas(
	[
		'scalar JSON',
		usersTypeDef
	],
	[
		usersQueries
	],
	[
		usersMutations
	]
);

// Generate the schema object from your types definition.
var graphQLSchema = graphqlTools.makeExecutableSchema({
	typeDefs: mergedTypeDefs,
	resolvers: merge(
		{ JSON: GraphQLJSON }, // allows scalar JSON
		resolvers
	)
});

const app = new Koa();
const router = new KoaRouter();
const PORT = process.env.PORT || 5000;

app.use(koaLogger());
app.use(koaCors());

// read token from header
app.use(async (ctx, next) => {
	if (ctx.header.authorization) {
		const token = ctx.header.authorization.split(" ");
		if (token && token[1]) {
			ctx.state.token = token[1];
		}
	}
	await next();
});

// GraphQL
const graphql$1 = apolloServerKoa.graphqlKoa((ctx) => ({
	schema: graphQLSchema,
	context: { token: ctx.state.token },
	formatError: formatErr,
	debug: true,
}));

router.post('/graphql', koaBody(), graphql$1);
router.get('/graphql', graphql$1);

// GraphiQL
router.get('/graphiql', apolloServerKoa.graphiqlKoa({ endpointURL: '/graphql' }));

app.use(router.routes());
app.use(router.allowedMethods());
// eslint-disable-next-line
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
