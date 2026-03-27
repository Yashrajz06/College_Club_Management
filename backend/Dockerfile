FROM node:24-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["sh", "-lc", "npx prisma generate && npm run start:dev"]
