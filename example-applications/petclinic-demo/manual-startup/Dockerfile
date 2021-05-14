FROM adoptopenjdk/openjdk11:alpine

ENV LANDSCAPE_TOKEN=token
ENV LANDSCAPE_SECRET=secret
ENV OC_COLLECTOR_ADDRESS=oc-collector:55678

ARG INSPECTIT_UPDATER=inspectit-updater.sh
ARG JAR_FILE=spring-petclinic-2.3.1.BUILD-SNAPSHOT.jar
ARG INSPECTIT_FILE=inspectit.yml

COPY ${INSPECTIT_UPDATER} inspectit-updater.sh
RUN chmod +x ./inspectit-updater.sh

COPY ${JAR_FILE} app.jar

RUN mkdir inspectit
COPY ${INSPECTIT_FILE} inspectit/inspectit.yml

CMD ./inspectit-updater.sh && java -jar /app.jar