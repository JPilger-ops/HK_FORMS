FROM mcr.microsoft.com/playwright:v1.57.0-jammy as base
WORKDIR /app
ENV HUSKY=0
COPY package.json ./
RUN npm install
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.57.0-jammy as runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=base /app .
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
