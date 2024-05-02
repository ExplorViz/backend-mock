## BEGIN Build stage

FROM eclipse-temurin:17 as build

RUN apt update \
  && apt install -y wget \
  && apt install -y unzip \
  && rm -rf /var/lib/apt/lists/*

RUN wget -q https://github.com/spring-projects/spring-petclinic/archive/refs/heads/main.zip && \
  unzip -q main && \
  rm main.zip && \
  mv spring-petclinic-main petclinic

# https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x#parameter-name-retention
ADD parameters-fix.txt /parameters-fix.txt

WORKDIR /petclinic

RUN cat /parameters-fix.txt >> build.gradle && ./gradlew assemble && mv build/libs/spring-petclinic-3.2.0.jar /app.jar

## END Build stage

## BEGIN Publish stage

FROM eclipse-temurin:17
COPY --from=build /app.jar /app.jar
CMD java -jar /app.jar

## END Publish stage
