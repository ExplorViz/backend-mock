# ExplorViz with automated ACME SSL certificate generation for Nginx-Proxy

## Requirements

- Domain with unused & online reachable `80` and `443` ports

## Getting started

1. `cd nginx-acme`
2. `docker compose up -d`
3. `cd ../explorviz`
4. `cp .env .env-custom`
5. Change `YOURDOMAIN` in `.env-custom` to your domain name
6. `docker compose --env-file .env-custom up -d`
