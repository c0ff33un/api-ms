FROM node:carbon-slim

# Create app directory
WORKDIR /taurus-api

# Install app dependencies
COPY package.json /taurus-api/
RUN npm install

# Bundle app source
COPY . /taurus-api/
RUN npm run prepublish

CMD [ "npm", "run", "runServer" ]
