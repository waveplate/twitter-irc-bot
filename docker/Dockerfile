FROM node:latest

USER root

COPY entrypoint.sh /home/node/entrypoint.sh
RUN chmod +x /home/node/entrypoint.sh

RUN apt update
RUN apt -y install curl git

RUN npm install -g tsx

USER node

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

RUN cd /home/node && \
    git clone https://github.com/anatolybazarov/img2irc && \
    cd img2irc && \
    ~/.cargo/bin/cargo build --release

USER root

RUN cp /home/node/img2irc/target/release/img2irc /usr/local/bin/img2irc

ENTRYPOINT ["/bin/bash", "/home/node/entrypoint.sh"]
