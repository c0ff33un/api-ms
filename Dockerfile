FROM node:carbon-slim

# Create app directory
WORKDIR /sa-api

# Install app dependencies
COPY package.json /sa-api/
RUN npm install

# Bundle app source
COPY . /sa-api/
RUN npm run prepublish

CMD [ "npm", "run", "runServer" ]
