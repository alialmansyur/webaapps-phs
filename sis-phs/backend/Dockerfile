FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    default-mysql-client \
    libonig-dev \
    && docker-php-ext-install pdo_mysql \
    && docker-php-ext-install mbstring \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts

COPY docker/start.sh /usr/local/bin/start-backend
RUN chmod +x /usr/local/bin/start-backend

EXPOSE 8000

CMD ["start-backend"]
