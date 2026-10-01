# 🚌 Pullman Bus Cuponera Web (Frontend)

Aplicación Web moderna y responsive construida con **Next.js (App Router)** y **React**, diseñada para la compra, administración y canje de cuponeras de viaje interurbano de Pullman Bus.

---

## 🚀 Características Principales

* **🛒 Catálogo de Cuponeras:** Visualización de paquetes de viajes (estándar y por tramos específicos), precios unitarios y totales, con modal de compra interactivo.
* **💳 Pasarela de Pago Webpay Plus:** Integración con Transbank Webpay Plus mediante flujo seguro server-to-server (`/api/payments/init` y retorno automático). Captura de RUT, Nombre, Email y Teléfono del cliente.
* **📊 Mi Dashboard:**
  * Vista general de saldo de cupones y cuponeras activas.
  * Identificación clara con prefijo oficial `CUP-WP{id}` para cada cuponera comprada.
  * Historial de pasajes emitidos con opciones de descarga y anulación.
* **🎟️ Flujo de Canje Integral (Kupos GDS):**
  1. Búsqueda de itinerarios, fechas y terminales de salida/llegada.
  2. Selección de asiento interactiva con mapa de bus en tiempo real.
  3. Reserva provisoria y confirmación de boleto electrónico oficial.
* **↩️ Anulación Normativa:** Permite anular el pasaje y reintegrar el saldo de la cuponera si restan 4 horas o más para la salida del servicio.
* **🛡️ Panel de Administración:** Mantenedor de cuponeras del catálogo y visualizador de registros de auditoría de canjes y pagos.

---

## 🛠️ Tecnologías

* **Framework:** Next.js 15+ (App Router)
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS + Lucide Icons + Radix UI
* **Gestión de Estado:** React Hooks & Zustand / LocalStorage

---

## ⚙️ Configuración y Variables de Entorno (`.env.local`)

```env
# URL base del Backend Centralizado Express
NEXT_PUBLIC_API_URL=https://cuponera.dev-wit.com/api
# Para entorno local:
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 💻 Ejecución en Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📦 Build para Producción

```bash
npm run build
npm run start
```

---

## ⚠️ Notas de Despliegue (SEO)

**IMPORTANTE:** Actualmente el sitio web está configurado para **NO** ser indexado por los motores de búsqueda (Google, Bing, etc.) mediante las etiquetas `noindex` en `layout.tsx` y el archivo `robots.txt`.
*Cuando el sitio pase a estar oficialmente en producción y abierto al público real, se DEBE recordar quitar estas directivas para habilitar el SEO nuevamente.*
