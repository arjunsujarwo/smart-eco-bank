# Smart Eco Bank

Smart Eco Bank is a waste-management platform for connecting users, waste
banks, transactions, rewards, locations, and administration tools.

This repository combines the three application layers:

| Directory | Description | Stack |
| --- | --- | --- |
| [`frontend-web`](./frontend-web) | Customer and admin web application | Next.js, TypeScript, Tailwind CSS |
| [`backend`](./backend) | REST API and real-time backend | Laravel, PHP |
| [`frontend-mobile`](./frontend-mobile) | Mobile application | Flutter, Dart |

## 📥 Unduh & Coba Aplikasi (Portfolio / Trial)

Aplikasi mobile dan desktop telah dibuild dan dapat langsung diunduh dari [**GitHub Releases v1.0.0**](https://github.com/arjunsujarwo/smart-eco-bank/releases/tag/v1.0.0):

| Platform | Format | Link Unduh | Cara Menjalankan |
| :--- | :--- | :--- | :--- |
| **Android** | `.apk` | [**Download APK (v1.0.0)**](https://github.com/arjunsujarwo/smart-eco-bank/releases/download/v1.0.0/smart-eco-bank-android-v1.0.0.apk) | Pasang langsung di HP Android Anda (izinkan *install unknown apps* jika diminta). |
| **Windows Desktop** | `.zip` | [**Download ZIP (v1.0.0)**](https://github.com/arjunsujarwo/smart-eco-bank/releases/download/v1.0.0/smart-eco-bank-windows-x64-v1.0.0.zip) | Ekstrak ZIP, lalu klik dua kali pada `smart_eco_bank.exe`. |

### 🔑 Akun Uji Coba (Demo Credentials)
Aplikasi mendukung mode simulasi mandiri (*dual-mode* offline mock & online API):
* **Nasabah (User)**: `user@example.com` / `password`
* **Administrator**: `admin@example.com` / `password`

---

## Getting started

Each directory contains its own setup instructions and dependency manifest.
Copy the relevant `.env.example` to `.env` before configuring a local
environment. Never commit credentials, API keys, or production environment
files.

## Project repositories

- [Web frontend](https://github.com/Smart-Eco-Bank-Development/Frontend-Web-SEB)
- [Backend](https://github.com/Smart-Eco-Bank-Development/Backend-SEB)
- [Mobile frontend](https://github.com/Smart-Eco-Bank-Development/Frontend-Mobile-SEB)
