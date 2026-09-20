# Smart Eco Bank

Smart Eco Bank is a waste-management platform for connecting users, waste
banks, transactions, rewards, locations, and administration tools.

This repository combines the three application layers:

| Directory | Description | Stack |
| --- | --- | --- |
| [`frontend-web`](./frontend-web) | Customer and admin web application | Next.js, TypeScript, Tailwind CSS |
| [`backend`](./backend) | REST API and real-time backend | Laravel, PHP |
| [`frontend-mobile`](./frontend-mobile) | Mobile application | Flutter, Dart |

## Getting started

Each directory contains its own setup instructions and dependency manifest.
Copy the relevant `.env.example` to `.env` before configuring a local
environment. Never commit credentials, API keys, or production environment
files.

## Project repositories

- [Web frontend](https://github.com/Smart-Eco-Bank-Development/Frontend-Web-SEB)
- [Backend](https://github.com/Smart-Eco-Bank-Development/Backend-SEB)
- [Mobile frontend](https://github.com/Smart-Eco-Bank-Development/Frontend-Mobile-SEB)

## Status

The mobile client currently contains mock service data while backend
integration is being completed. Review the individual project README files for
known limitations and local development requirements.
