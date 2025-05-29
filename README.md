# 📊 Sistema de Registro de Actividad Criminal

<div align="center">

![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.3.0-blue)
![Fecha](https://img.shields.io/badge/Última%20Actualizaci%C3%B3n-Mayo%202025-brightgreen)
![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n-success)

</div>

## 🔎 Descripción

Esta aplicación web permite registrar, visualizar y gestionar información sobre actividades criminales y delincuentes capturados. Es una herramienta diseñada para uso interno de empresas de seguridad, departamentos legales o instituciones que requieran llevar un control digital de incidentes y reportes.

<div align="center">

**✨ [Ver Demo en Vivo](https://registro-actividad-criminal.onrender.com) ✨**

</div>

## 💻 Tecnologías utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Bibliotecas:** Bootstrap 5, Font Awesome, jsPDF
- **Almacenamiento:** LocalStorage (persistencia de datos en navegador)
- **Despliegue:** Render (hosting)

## ✨ Funcionalidades principales

- 📊 **Registro de casos delictivos** por trimestre y empresa
- 👮 **Gestión de delincuentes capturados:** alta, visualización y almacenamiento local
- 📈 **Generación de reportes** y tablas estadísticas
- 📱 **Interfaz responsiva** adaptable para escritorio y dispositivos móviles
- 🔐 **Sistema de autenticación** para proteger datos sensibles
- 💾 **Exportación de datos** en formato PDF

## 📍 Instalación y uso local

```bash
# Clonar el repositorio
git clone https://github.com/SupervisorIT/registro-actividad-criminal.git

# Navegar al directorio del proyecto
cd registro-actividad-criminal

# Abrir en navegador (opción 1: usando Python)
python -m http.server 8000

# Abrir en navegador (opción 2: usando Node.js)
npx serve
```

O simplemente abre el archivo `index.html` en tu navegador.

## 📝 Guía de uso

1. **Iniciar sesión:**
   - Usuario: `admin`
   - Contraseña: `SupervisorIT2025`

2. **Registrar un caso:**
   - Completa los datos de empresa, responsable, fecha y trimestre
   - Añade los casos delictivos ocurridos, su tipificación, fecha, cuantía y observaciones

3. **Agregar delincuente capturado:**
   - Haz clic en el botón `+` en la sección correspondiente
   - Completa el formulario del modal y guarda el registro
   - Los datos se almacenan en el navegador (localStorage) y se muestran en la tabla

4. **Exportar o visualizar reportes:**
   - Utiliza las opciones de la interfaz para generar reportes o consultar estadísticas

5. **Panel de administración:**
   - Accede al panel de administración para cambiar la contraseña
   - Gestiona la configuración del sistema

## 💡 Notas importantes

- **Persistencia:** Los datos se guardan en el navegador del usuario (localStorage). Si borras el caché, se perderán los registros.
- **Despliegue:** El sitio está publicado en Render con HTTPS habilitado para mayor seguridad.
- **Compatibilidad:** Optimizado para navegadores modernos (Chrome, Firefox, Edge, Safari).
- **Manual de usuario:** Disponible en la aplicación a través del botón de ayuda.

## 💬 Soporte y contacto

Para reportar errores, sugerencias o solicitar soporte:

- **Correo electrónico:** lboutin@outlook.es (asunto: "Reporte de Error")
- **Repositorio:** [GitHub - SupervisorIT/registro-actividad-criminal](https://github.com/SupervisorIT/registro-actividad-criminal)
- **Sitio web:** [registro-actividad-criminal.onrender.com](https://registro-actividad-criminal.onrender.com)

## 📝 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados.

---

<div align="center">

**Desarrollado por SupervisorIT © 2025**

</div>
