# --- ESTÁGIO 1: BUILD (Compilação do Projeto) ---
# Usa a imagem Corretto JDK na base Alpine para compilar
FROM amazoncorretto:21-alpine-jdk AS build

WORKDIR /app

# [Resto da sua lógica de cópia de pom.xml e src...]
COPY pom.xml /app/
COPY src /app/src

# [Resto da sua lógica de build]
RUN apk update && apk add maven && \
    mvn clean package -DskipTests
    
# --- ESTÁGIO 2: RUNTIME (Imagem Final e Leve) ---
# Usa a imagem Corretto JRE na base Alpine (muito mais leve)
FROM amazoncorretto:21-alpine

WORKDIR /opt/app

# Copiar o JAR da aplicação
COPY --from=build /app/target/system-0.0.1-SNAPSHOT.jar app.jar

# Copiar o script de inicialização
COPY entrypoint.sh /opt/app/entrypoint.sh

# Tornar o script executável
RUN chmod +x /opt/app/entrypoint.sh

# Usar o entrypoint.sh como ponto de entrada
# O script criará/validará os diretórios e depois iniciará a aplicação Java
ENTRYPOINT ["/opt/app/entrypoint.sh"]