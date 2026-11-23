FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
RUN npm install --no-audit --no-fund

FROM dependencies AS api
COPY api/prisma api/prisma
RUN npm --workspace api run prisma:generate
COPY api api
ENV NODE_ENV=production API_PORT=3000
EXPOSE 3000
CMD ["npm", "--workspace", "api", "run", "start"]

FROM dependencies AS web-build
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY web web
RUN npm --workspace web run build

FROM nginx:1.29-alpine AS web
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/web/dist /usr/share/nginx/html
EXPOSE 80

