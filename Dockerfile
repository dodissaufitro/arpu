# =========================
# BASE IMAGE
# =========================
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# =========================
# SET PROXY (DISKOM)
# =========================
ENV http_proxy="http://10.15.3.20:80"
ENV https_proxy="http://10.15.3.20:80"

# =========================
# SET APT PROXY
# =========================
RUN echo 'Acquire::http::Proxy "http://10.15.3.20:80";' > /etc/apt/apt.conf.d/95proxies && \
    echo 'Acquire::https::Proxy "http://10.15.3.20:80";' >> /etc/apt/apt.conf.d/95proxies

# =========================
# UPDATE & BASIC TOOLS
# =========================
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    software-properties-common \
    ca-certificates

# =========================
# INSTALL NODE JS 22
# =========================
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# =========================
# INSTALL PHP 8.2
# =========================
RUN add-apt-repository ppa:ondrej/php -y && \
    apt-get update && \
    apt-get install -y \
    php8.2 \
    php8.2-cli \
    php8.2-common \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-curl \
    php8.2-mysql \
    php8.2-zip

# =========================
# INSTALL COMPOSER 2.8.5
# =========================
RUN curl -sS https://getcomposer.org/installer -o composer-setup.php && \
    php composer-setup.php --version=2.8.5 && \
    mv composer.phar /usr/local/bin/composer && \
    rm composer-setup.php

# =========================
# WORKDIR
# =========================
WORKDIR /app

# =========================
# TEST VERSION
# =========================
RUN node -v && npm -v && php -v && composer -V

# =========================
# DEFAULT COMMAND
# =========================
CMD ["bash"]

