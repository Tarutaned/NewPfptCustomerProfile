# Use the official image as a parent image.
FROM node:14.1.0-stretch

# Set the working directory.
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 81

CMD node app.js

