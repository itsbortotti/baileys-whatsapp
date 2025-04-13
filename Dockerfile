# Estágio de construção
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instalar todas as dependências incluindo as de desenvolvimento
RUN npm ci

# Copiar o restante dos arquivos da aplicação
COPY . .

# Executar o build
RUN npm run build

# Estágio de produção
FROM node:20-alpine

WORKDIR /app

# Copiar apenas os arquivos necessários para a execução
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Expor a porta da aplicação
EXPOSE 3000

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]

