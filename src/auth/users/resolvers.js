import { generalRequest, getRequest } from '../../utilities';
import { auth_url, data_url, match_url, game_url, grid_url, auth_port, data_port, grid_port, game_port, match_port} from './server';
import request from 'request-promise-native';

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
					console.log(res)

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
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
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
						console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
						if(res.statusCode != 200){
							return new Error(res.message)
						}

						const {id, handle, email} = res.body
						await generalRequest(`${DATA_URL}/graphql`,'POST', { query: `mutation{ addUser(authId:${id},handle: "${handle}", email:"${email}"){authId}}`})
						await generalRequest(`${MATCH_URL}/create`,'POST', { userid: Number(`${id}`)})
						return res.body
					})
					.catch(err => new Error(err))
		,
		login: (_, { user }) => 
			generalRequest(`${AUTH_URL}/login`, 'POST', { user }, true)
				.then(res => {
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
					if(res.statusCode != 201){
						return new Error(res.message)
					}

					const data = res.body, jwt = res.headers.authorization.split(" ")[1]

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
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
				if(res.statusCode != 200){
					return new Error(res.message)
				}

				const data = res.body, jwt = res.headers.authorization.split(" ")[1]

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
				console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")

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
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
					if(!res.id){
						console.log(res)
						return new Error("401 UNAUTHORIZED")
					}

					const createRoom = generalRequest(`${GAME_URL}/room`, 'POST')

					return Promise.all([createRoom])
						.then(res => {
							const room_info = res[0]

							console.log(room_info)
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
					console.log("@@@@@@@@@@@@@@@@@@\n",res.statusCode,res.error,res.body,"@@@@@@@@@@@@@@@@@@\n")
					if(!res.id){
						console.log(res)
						return new Error("401 UNAUTHORIZED")
					}

					const generateGrid = generalRequest(`${GRID_URL}/grid?seed=${Number(settings.seed)}${settings.w?`&width=${settings.w}`:""}${settings.h?`&height=${settings.h}`:""}`, '')
					const saveGridInAGame = generalRequest(`${DATA_URL}/graphql`,'POST',{query:`mutation {addGame(seed: \"${settings.seed}\"){id seed}}`})

					return Promise.all([generateGrid,saveGridInAGame])
						.then(res => {
							const grid_info = res[0], game_info = res[1].data.addGame
							let matrix = []
							
							grid_info.matrix.forEach(row => {
								row.forEach(item => {
									matrix.push(item)
								})
							});

							console.log(grid_info,game_info)
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

export default resolvers;
