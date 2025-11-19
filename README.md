# 🎬 Stremio Custom Catalogs

**Stremio Custom Catalogs** es una aplicación web full-stack que te permite crear, gestionar y compartir tus propios catálogos personalizados para [Stremio](https://www.stremio.com/).

Con esta herramienta, puedes diseñar listas de películas y series a tu gusto (por ejemplo: "Maratón de Halloween", "Mis Favoritas de los 90", "Universo Marvel") y añadirlas directamente a tu Stremio mediante un addon generado dinámicamente para ti.

## ✨ Características

-   **🔍 Búsqueda Integrada en TMDB**: Busca películas y series directamente desde la aplicación utilizando la API de The Movie Database (TMDB).
-   **📂 Gestión de Catálogos**: Crea, edita y elimina tus propios catálogos.
-   **👤 Sistema de Usuarios**: Regístrate y mantén tus catálogos privados y seguros.
-   **🔗 Integración con Stremio**: Genera un enlace de instalación único para añadir tus catálogos a Stremio con un solo clic.
-   **⚡ Actualización en Tiempo Real**: Los cambios que hagas en la web se reflejan instantáneamente en Stremio.
-   **🎨 Interfaz Moderna**: Diseñada con React y TailwindCSS para una experiencia de usuario fluida y atractiva.

## 🛠️ Tecnologías Utilizadas

### Backend
-   **Node.js** & **Express**: Servidor robusto y API RESTful.
-   **Prisma ORM**: Gestión de base de datos eficiente y segura.
-   **SQLite**: Base de datos ligera y rápida (fácilmente escalable a PostgreSQL/MySQL).
-   **JWT**: Autenticación segura basada en tokens.

### Frontend
-   **React**: Biblioteca para construir interfaces de usuario interactivas.
-   **Vite**: Entorno de desarrollo ultrarrápido.
-   **TailwindCSS**: Framework de utilidades CSS para un diseño rápido y responsive.
-   **Lucide React**: Iconos vectoriales ligeros y bonitos.

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

### Prerrequisitos
-   Node.js (v18 o superior)
-   npm
-   Una API Key de [TMDB](https://www.themoviedb.org/documentation/api)

### Pasos

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/tu-usuario/stremio-custom-catalogs.git
    cd stremio-custom-catalogs
    ```

2.  **Configurar el Backend**
    ```bash
    cd server
    npm install
    ```
    Crea un archivo `.env` en la carpeta `server` basándote en `.env.example`:
    ```env
    DATABASE_URL="file:./dev.db"
    TMDB_API_KEY="TU_API_KEY_DE_TMDB"
    JWT_SECRET="tu_secreto_super_seguro"
    PORT=3000
    ```

3.  **Configurar el Frontend**
    ```bash
    cd ../client
    npm install
    ```

4.  **Construir el Frontend**
    Para que el servidor de Node sirva la aplicación React, primero debes construirla:
    ```bash
    npm run build
    ```

5.  **Iniciar la Aplicación**
    Vuelve a la carpeta del servidor y arranca el proyecto:
    ```bash
    cd ../server
    npx prisma db push  # Crea la base de datos SQLite
    npm run dev
    ```

6.  **¡Listo!**
    Abre tu navegador en `http://localhost:3000`.

## 🤝 Contribución

Las contribuciones son bienvenidas. Si tienes ideas para mejorar este proyecto, no dudes en abrir un *issue* o enviar un *pull request*.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

Hecho con ❤️ para la comunidad de Stremio.
