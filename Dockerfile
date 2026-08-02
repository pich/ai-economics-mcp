# The server speaks MCP over stdio, so the container has no ports and no
# entrypoint script — `docker run -i` is the transport.
FROM node:22-alpine

WORKDIR /app

# Only the manifests first, so the dependency layer survives edits to index.js.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js README.md LICENSE ./

# Non-root: the server reads no files and writes none, so it needs nothing more.
USER node

ENTRYPOINT ["node", "/app/index.js"]
