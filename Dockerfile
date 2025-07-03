FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json pnpm-lock.yaml* ./


RUN pnpm install --frozen-lockfile

# Bundle app source
COPY . .

CMD [ "pnpm", "start" ]
