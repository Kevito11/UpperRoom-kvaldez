# Upper Room IBC • Conferencia Despierta 2026

Sitio web oficial y plataforma de registro para la Conferencia de Jóvenes **Upper Room IBC** (Iglesia Bautista Cristiana) en Santo Domingo, República Dominicana.

---

## 🌟 Características Principales

- **Registro de Asistentes & Emisión de Boletas**: Formulario validado con generación automática de tickets únicos y códigos QR interactivos con verificación instantánea.
- **Pase Digital Completo**: Vista de pantalla completa del ticket (`Ticket Pass`) para presentación digital y descarga de comprobante.
- **Integración con Google Sheets & Apps Script**: Envío asíncrono de registros con confirmación por correo electrónico automatizada (HTML responsivo + ticket pass digital).
- **Cuenta Regresiva & Programa**: Cuenta regresiva en vivo hacia el evento y desglose de sesiones y expositores bíblicos.
- **Catálogo de Merchandising**: Muestra interactiva de polos, gorras, tote bags y botellas con modal de tallas y pedidos por WhatsApp.
- **Diseño Responsivo & Estética Obsidian Fire**: Paleta de colores cálidos y carbón volcánico inspirada en la identidad gráfica oficial de la conferencia.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, React Router v7, Vite
- **Iconografía & Efectos**: Lucide React, Canvas Confetti, QRCode
- **Backend / Integración**: Google Apps Script Webhook & Google Sheets API
- **Estilos**: Vanilla CSS moderno con variables HSL, tokens de diseño responsivos y micro-animaciones

---

## 🚀 Puesta en Marcha Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar las variables de entorno:
   Copiar `.env.example` a `.env` y configurar la URL del Web App de Google Apps Script:
   ```env
   VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📄 Créditos

- Desarrollado por **kvaldez** para la comunidad juvenil de **Upper Room IBC**.

