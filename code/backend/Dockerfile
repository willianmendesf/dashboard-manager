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

# [Resto da sua lógica de criação de diretórios e CMD]
RUN mkdir -p /opt/app/images && \
    mkdir -p /opt/app/files && \
    chmod 777 /opt/app/images && \
    chmod 777 /opt/app/files

WORKDIR /opt/app

COPY --from=build /app/target/system-0.0.1-SNAPSHOT.jar app.jar

CMD ["java", "-jar", "app.jar"]