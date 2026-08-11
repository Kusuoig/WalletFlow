# 💳 WalletFlow

<p align="center">
  <strong>Gestor financiero personal, inteligente y privado para el control total de tus tarjetas de crédito y débito.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zustand-State_Management-443e38?style=for-the-badge" alt="Zustand" />
</p>

---

## 📌 ¿Qué es WalletFlow?

**WalletFlow** es una aplicación móvil desarrollada con **React Native** y **Expo** diseñada para ayudarte a tomar el control de tu flujo de dinero sin comprometer tu privacidad. 

A diferencia de otras aplicaciones financieras en la nube, WalletFlow opera bajo una arquitectura **Local-First**: todos tus datos financieros se almacenan y procesan de forma **100% local y segura en tu dispositivo** mediante SQLite.

---

## ✨ Características Principales

- 💳 **Gestión de Tarjetas (Crédito y Débito):**
  - Diferenciación visual inteligente con códigos de color e interfaces adaptativas.
  - Seguimiento de saldos disponibles, límites de crédito y cálculo dinámico de días para la fecha de corte.
- 🏦 **Detección Dinámica de Bancos & Logos:**
  - Selector inteligente de bancos (Santander, BBVA, Revolut, Openbank, Ualá, Plata, etc.).
  - Búsqueda automática de colores y logos institucionales (con soporte para bancos personalizados).
- 🔄 **Flujo de Pagos y Ajustes:**
  - Abona pagos a tarjetas de crédito descontando saldo directamente desde tus cuentas de débito.
  - Ajustes manuales rápidos de balance con registro automático de auditoría.
- 📜 **Historial de Movimientos:**
  - Registro cronológico detallado de pagos, transferencias y ajustes por tarjeta o globales.
- 🔒 **Privacidad & Respaldos (Offline-First):**
  - Tus datos nunca salen de tu teléfono.
  - Herramienta integrada para **exportar e importar copias de seguridad** de tu base de datos SQLite.

---

## 📱 Vistas de la Aplicación

> *(Tip: Agrega aquí capturas o GIFs de tu aplicación)*

| Dashboard Principal | Detalle de Tarjeta | Historial de Movimientos |
| :---: | :---: | :---: |
| *(Captura Dashboard)* | *(Captura Detalle)* | *(Captura Historial)* |

---

## 🛠️ Stack Tecnológico

- **Core:** [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (con [Expo Router](https://docs.expo.dev/router/introduction/))
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos:** [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Gestor de Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Animaciones e Iconos:** React Native Reanimated, Expo Vector Icons & Expo Image

---

## 📂 Estructura del Proyecto

```text
src/
├── app/            # Rutas y pantallas (Expo Router: tabs, detalle de tarjeta)
├── components/     # Modales (Ajustes, Pagos, Nueva Tarjeta) y componentes UI
├── constants/      # Constantes globales, colores y temas
├── db/             # Esquema SQLite, migraciones y queries locales
├── store/          # Estado global con Zustand
└── types/          # Definiciones de TypeScript
