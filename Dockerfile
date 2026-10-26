# 1. Export the Next.js frontend as static files (pages read ../templates at build time).
FROM node:26-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY templates /build/templates
COPY frontend ./
RUN npm run build

# 2. Package the Spring Boot backend with the frontend as static resources.
FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -q dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /build/frontend/out ./src/main/resources/static
RUN mvn -q -DskipTests package

# 3. Run. The SQLite database lives inside the container and is recreated on every start.
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend /build/target/prelegal-*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-jar", "app.jar"]
