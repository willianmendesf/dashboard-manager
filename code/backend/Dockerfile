FROM openjdk:21-jdk-slim

# Criar diretórios para imagens e arquivos temporários
# Nota: Quando volumes são montados, eles sobrescrevem o conteúdo do diretório,
# mas as permissões do diretório base são mantidas
RUN mkdir -p /opt/app/images && \
    mkdir -p /opt/app/files && \
    chmod 777 /opt/app/images && \
    chmod 777 /opt/app/files

WORKDIR /app

COPY target/system-0.0.1-SNAPSHOT.jar app.jar

# Garantir que os diretórios existam e tenham permissões corretas ao iniciar
# Isso é importante caso o volume não seja montado ou seja montado vazio
RUN mkdir -p /opt/app/images /opt/app/files && \
    chmod -R 777 /opt/app/images /opt/app/files || true

CMD ["java", "-jar", "app.jar"]