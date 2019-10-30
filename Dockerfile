FROM node:10
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y ffmpeg python gpac
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY . .

RUN npm ci --only=production --unsafe-perm
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
EXPOSE 7979
RUN npm start
