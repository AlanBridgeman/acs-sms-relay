FROM node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY .npmrc ./
COPY package*.json ./
RUN yarn install

# Compile/build the app code
COPY src ./src
COPY tsconfig.json ./
RUN yarn build

# Copy other needed files
COPY public ./public
COPY pages ./pages
COPY .env.docker ./.env

EXPOSE 8080
CMD [ "yarn", "start" ]