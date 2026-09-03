# Build context must be the ROOT of the repo (not /backend), porque el build de
# Gradle compila la web (../web) y la empaqueta dentro del jar del backend.
FROM eclipse-temurin:21-jdk-alpine AS build
RUN apk add --no-cache nodejs npm
WORKDIR /workspace

COPY backend/gradlew backend/gradlew.bat backend/build.gradle.kts backend/settings.gradle.kts backend/
COPY backend/gradle backend/gradle
COPY web/package.json web/package-lock.json web/
RUN cd backend && ./gradlew --no-daemon dependencies || true

COPY backend/src backend/src
COPY web web
RUN cd backend && ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/backend/build/libs/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=UTC", "-jar", "app.jar"]
