FROM adoptopenjdk/openjdk11:alpine

RUN wget -q https://github.com/spring-projects/spring-petclinic/archive/refs/heads/main.zip && \
  unzip -q main && \
  rm main.zip && \
  mv spring-petclinic-main petclinic

RUN cd /petclinic && ./mvnw package -q && mv target/*.jar /app.jar && rm -rf petclinic

CMD java -jar app.jar
