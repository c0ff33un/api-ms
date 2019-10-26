import { generalRequest, getRequest } from '../../utilities';
import { auth_url, data_url, match_url, game_url, grid_url, auth_port, data_port, grid_port, game_port, match_port} from './server';
import request from 'request-promise-native';


const AUTH_URL = `http://${auth_url}:${auth_port}`;
const DATA_URL = `http://${data_url}:${data_port}`;
const MATCH_URL = `http://${match_url}:${match_port}`;
const GRID_URL = `http://${grid_url}:${grid_port}`;
const GAME_URL = `http://${game_url}:${game_port}`;
// const GAME_URL = `http://localhost:${game_port}`;

const resolvers = {
	Query: {
		allUsers: (_) =>
			generalRequest(`${DATA_URL}/graphql?query=\{users \{id handle email matches\{id\} won\{id\}\}\}`,'GET',{})
	},
	Mutation: {
		signup: (_, { user }) => 
			generalRequest(`${AUTH_URL}/signup`, 'POST', { user }, false)
			 .then(res => {
				console.log("@@@@@@@@@@@@@@@@@@\n",res,"@@@@@@@@@@@@@@@@@@\n")
				return res
			})
			.catch(err => new Error(err))
		,
		login: (_, { user }) => 
			generalRequest(`${AUTH_URL}/login`, 'POST', { user }, true)
				.then(res => {
					if(res.statusCode != 201){
						return new Error(res.message)
					}

					const data = res.body, jwt = res.headers.authorization.split(" ")[1]

					return {
						id:data.id,
						name:data.name,
						email:data.email,
						handle:data.handle,
						jwt
					}
				})
				.catch(err => new Error(err))
		,
		confirmation: (_, { token }) => 
				generalRequest(`${AUTH_URL}/confirmation?confirmation_token=${token}`, 'GET', {}, false)
					.then(async res => {
						await generalRequest(`${DATA_URL}/graphql`,'POST', { query: `mutation{ addUser(authId:${res.id},handle: "${user.handle}", email:"${user.email}"){authId}}`})
						await generalRequest(`${MATCH_URL}/create`,'POST', { userid: Number(`${res.id}`)})
						console.log("@@@@@@@@@@@@@@@@@@\n",res,"@@@@@@@@@@@@@@@@@@\n")
						return res
					})
					.catch(err => new Error(err))
		,
		room: (_, { token }, context) => {
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
					if(!res.id){
						console.log(res)
						return new Error("401 UNAUTHORIZED")
					}
					return generalRequest(`${GAME_URL}/room`, 'POST')
						.then(res => {
							console.log("@@@@@@@@@@@@@@@@@@\n",res,"@@@@@@@@@@@@@@@@@@\n")
							return res
						})
						.catch(err => new Error(err))
				})
				.catch(err => new Error(err))
		},
		logout: (_, {}, context) => {
			if(!context.token){
				return new Error("401 UNAUTHORIZED")
			}

			return generalRequest(`${AUTH_URL}/logout`, 'DELETE', {}, false, {"Authorization": `Bearer ${context.token}`})
			.then(async res => {
				console.log("@@@@@@@@@@@@@@@@@@\n",res,"@@@@@@@@@@@@@@@@@@\n")
				return res
			})
			.catch(err => new Error(err))
		}

	}
};

export default resolvers;
