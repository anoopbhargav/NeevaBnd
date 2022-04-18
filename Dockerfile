FROM node:14

LABEL version="1.0"
LABEL description="Docker image for backend of  Neeva data labelling app"
LABEL maintainer = ["anoop.bhargav@ionidea.com"]

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
 
RUN npm install
 
COPY . .
 
EXPOSE 5000

CMD [ "npm", "start" ]