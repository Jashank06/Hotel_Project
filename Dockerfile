# Multi-stage Dockerfile for Hotel Management Portal
FROM alpine:latest AS builder
RUN apk add --no-cache bash
WORKDIR /app
COPY . .
RUN chmod +x assemble.sh && ./assemble.sh

FROM nginx:alpine
# Copy built files and static assets into Nginx public directory
COPY --from=builder /app /usr/share/nginx/html

# Custom nginx config if needed or default nginx static serving
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
