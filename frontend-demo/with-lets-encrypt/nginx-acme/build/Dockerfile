FROM nginxproxy/nginx-proxy:alpine

RUN { \
      echo 'server_tokens off;'; \
      echo 'client_max_body_size 10G;'; \
    } > /etc/nginx/conf.d/my_proxy.conf
