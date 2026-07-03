# syntax=docker/dockerfile:1

FROM node:22-alpine AS web-build
WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

FROM golang:1.25-alpine AS go-build
WORKDIR /app/server

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ ./
COPY --from=web-build /app/web/dist ./internal/static/dist

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=go-build /server /app/server

ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
