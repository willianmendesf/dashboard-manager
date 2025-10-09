FROM openjdk:21-jdk-slim

RUN mkdir -p /opt/app/images

RUN mkdir -p /opt/app/files

#RUN chown -R <app_user>:<app_group> /opt/app/images
RUN chmod 777 /opt/app/images 

RUN chmod 777 /opt/app/files

WORKDIR /app

COPY target/system-0.0.1-SNAPSHOT.jar app.jar

CMD ["java", "-jar", "app.jar"]