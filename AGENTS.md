# Contexto de WalletFlow

WalletFlow es una aplicación móvil nativa desarrollada con React Native, TypeScript y Expo (utilizando el enrutador de archivos expo-router). Está diseñada para ser un gestor personal de finanzas centrado en el control, visualización y administración de tarjetas de crédito y débito de forma local y segura.

A continuación, te detallo el contexto y todo lo que compone la aplicación hasta el momento:

1. Arquitectura Técnica y Base de Datos
   Base de Datos Local (SQLite): Toda la información se guarda en la base de datos del dispositivo (tarjetas.db gestionada por expo-sqlite). El esquema cuenta con dos tablas principales:
   cards (Tarjetas): Almacena el nombre de la tarjeta, banco emisor, tipo (debit o credit), saldo, límite de crédito (solo crédito), día de corte de la tarjeta (solo crédito) y el color asignado en la UI.
   transactions (Transacciones): Registra los movimientos con descripción, tipo (payment para pagos, adjustment para ajustes de saldo, transfer para traspasos), monto, tarjeta de origen y tarjeta de destino.
   Estado Global (zustand): Se utiliza una tienda de estado ligero y rápido (src/store/useCardsStore.ts) para sincronizar y refrescar las tarjetas en toda la aplicación de manera reactiva.
   Estética del Diseño: Diseñado con un sistema visual premium que diferencia los tipos de tarjeta mediante los colores de tus variables globales: verde (#0D5945) para débito y rojo (#AB2123) para crédito, aplicados en textos, barras de progreso y los bordes izquierdos de las tarjetas.

2. Vistas y Pantallas (Rutas de la App)
   La navegación se organiza mediante pestañas ((tabs)) y una pantalla de detalle dinámica:
   Dashboard / Vista Principal (src/app/(tabs)/index.tsx):
   Muestra un resumen general: Saldo disponible (débito) y deuda total (crédito).
   Lista todas las tarjetas registradas (CardItem.tsx) mostrando su nombre, banco, saldo, días para el corte (si es de crédito), barra de uso de límite crediticio y su logo.
   Permite abrir el formulario para agregar tarjetas.
   Detalle de Tarjeta (src/app/card/[id].tsx):
   Muestra información extendida y detallada de la tarjeta seleccionada (saldo actual, deudas o límites).
   Ofrece acciones rápidas como: Ajustar saldo, Pagar deuda (si es de crédito) o Eliminar tarjeta.
   Desglosa el historial de movimientos específicos realizados únicamente con esa tarjeta.
   Historial de Movimientos (src/app/(tabs)/history.tsx):
   Lista cronológica y detallada de todas las transacciones realizadas en la aplicación (pagos, ajustes y traspasos).
   Ajustes (src/app/(tabs)/settings.tsx):
   Configuración general que permite hacer copias de seguridad de tus datos (importar y exportar la base de datos de SQLite local).

3. Modales y Lógica de Operación (src/components)
   CardFormModal.tsx (Agregar Tarjeta):
   Permite elegir entre tipo de tarjeta: Débito o Crédito.
   Selector inteligente de bancos: Muestra un listado horizontal con Santander, BBVA, Revolut, Openbank, Ualá, Plata y Otro.
   Filtro dinámico: Si seleccionas "Débito", solo se muestran los bancos compatibles con débito. Si seleccionas "Crédito", solo los compatibles con crédito.
   Asignación inteligente de logos y colores: Busca automáticamente el logo del banco en internet usando Google Favicon API (incluso si escribes un banco personalizado mediante "Otro", ej: Invex). Si no encuentra ningún sitio web, aplica un icono y badge genérico. Rellena también el color institucional de tu banco automáticamente.
   AdjustmentModal.tsx (Ajustar Saldo):
   Permite ajustar el balance actual de cualquier tarjeta directamente de forma manual, generando un movimiento de tipo adjustment para mantener el registro en el historial.
   PaymentModal.tsx (Realizar Pago):
   Lógica específica para tarjetas de crédito. Permite seleccionar una tarjeta de débito de origen para abonar saldo/pagar deuda de la tarjeta de crédito, reduciendo los saldos correspondientes en ambas y creando un movimiento de tipo payment.
