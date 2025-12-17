FROM mcr.microsoft.com/playwright:v1.57.0-jammy as base
WORKDIR /app
ENV LANG=de_DE.UTF-8
ENV LC_ALL=de_DE.UTF-8
ENV LANGUAGE=de_DE:de
RUN apt-get update && \
    apt-get install -y locales && \
    locale-gen de_DE.UTF-8 && \
    update-locale LANG=de_DE.UTF-8 && \
    rm -rf /var/lib/apt/lists/*
ENV HUSKY=0
# Prisma 7 requires DATABASE_URL at build time for `prisma generate`
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hkforms
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.57.0-jammy as runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV LANG=de_DE.UTF-8
ENV LC_ALL=de_DE.UTF-8
ENV LANGUAGE=de_DE:de
RUN apt-get update && \
    apt-get install -y locales && \
    locale-gen de_DE.UTF-8 && \
    update-locale LANG=de_DE.UTF-8 && \
    rm -rf /var/lib/apt/lists/*
COPY --from=base /app .
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
