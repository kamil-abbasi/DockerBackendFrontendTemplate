FROM node:26-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

RUN npm install -g corepack
RUN corepack enable

WORKDIR /app

COPY package.json ./

FROM base AS dev

RUN apk add curl

RUN pnpm install --ignore-scripts

COPY . .

EXPOSE 3000

CMD ["pnpm", "start:dev"]

FROM base AS prod

RUN pnpm install -P --ignore-scripts

COPY . .

EXPOSE 3000

CMD ["node", "dist/bootstrap.js"]