## BEGIN Build stage

FROM openjdk:17-slim as build

RUN apt update \
  && apt install -y wget \
  && apt install -y unzip \
  && rm -rf /var/lib/apt/lists/*

RUN wget -q https://github.com/spring-projects/spring-petclinic/archive/refs/heads/main.zip && \
  unzip -q main && \
  rm main.zip && \
  mv spring-petclinic-main petclinic

ENV MVNW_VERBOSE=true

RUN cd /petclinic && ./mvnw package -q && mv target/*.jar /app.jar

## END Build stage

## BEGIN Publish stage

FROM openjdk:17-slim
COPY --from=build /app.jar /app.jar
CMD java -jar app.jar

## END Publish stage
