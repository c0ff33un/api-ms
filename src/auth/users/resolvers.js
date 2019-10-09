import { generalRequest, getRequest } from '../../utilities';
import { url, port} from './server';

const URL = `http://${url}:${port}`;

const resolvers = {
	Query: {
		allUsers: (_) =>
			getRequest(URL, '')
	},
	Mutation: {
		signUp: (_, { user }) =>
			generalRequest(`${URL}/signup`, 'POST', { user } ),
		logIn: (_, { user }) =>
			generalRequest(`${URL}/login`, 'POST', { user } ),
	}
};

export default resolvers;
