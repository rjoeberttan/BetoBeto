FROM node:14.17-alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN mkdir -p /var/log/app
RUN touch /var/log/app/settlement.log
RUN chmod 666 /var/log/app/settlement.log
CMD ["npm", "run", "start"]