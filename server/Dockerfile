FROM node:18

ENV BASE_DIR=/var/www/crucible/

WORKDIR ${BASE_DIR}/server

RUN mkdir /root/.ssh

ADD . .

ADD ./src/manta/crucibletest-id_rsa /root/.ssh

RUN npm i -g manta manta-sync

COPY package.json yarn.lock* ./

# Run npm and install packages
RUN yarn

CMD echo -e "\n\n======== Run \n\n\t'docker exec -it server-app /bin/bash'\n\n======== to log into the container ========\n"  && \
 cd ${BASE_DIR}/server && yarn && yarn build && yarn watch