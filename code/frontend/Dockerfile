# --- ESTÁGIO 1: BUILD DA APLICAÇÃO ---
# Usa a imagem oficial do Node 20 LTS (Lightweight Alpine) para o build.
FROM node:20-alpine as builder

# INSTALAR DEPENDÊNCIAS DE COMPATIBILIDADE PARA ALPINE
RUN apk add libc6-compat

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install  --force

# Copia o código-fonte restante
COPY . .

# Compila a aplicação Angular para produção
# ATENÇÃO: Verifique o comando "npm run build" e o caminho de saída (dist/nome-do-projeto)
RUN npm run build -- --output-path ./dist --configuration production


# --- ESTÁGIO 2: SERVIDOR WEB FINAL (NGINX) ---
# Usa uma imagem Nginx leve para servir os arquivos estáticos.
FROM nginx:alpine

# Copia a configuração personalizada do Nginx (necessária para roteamento Angular)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia APENAS os arquivos compilados do estágio anterior
# ATENÇÃO: SUBSTITUA 'seu-projeto-angular' pelo nome real da pasta de saída do seu build!
COPY --from=builder /app/dist/dashboard /usr/share/nginx/html

# Porta padrão de serviço do Nginx
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]