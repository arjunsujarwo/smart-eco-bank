FROM php:8.3-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install intl mbstring pdo_pgsql zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/apache2.conf \
    && chown -R www-data:www-data storage bootstrap/cache \
    && composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

COPY docker/entrypoint.sh /usr/local/bin/seb-entrypoint
RUN chmod +x /usr/local/bin/seb-entrypoint

EXPOSE 80
ENTRYPOINT ["seb-entrypoint"]
