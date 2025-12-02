# Sistema de Registro de Actividad Criminal

![Versión](https://img.shields.io/badge/Versión-1.5.0-blue)
![Fecha](https://img.shields.io/badge/Última%20Actualización-Agosto%202025-brightgreen)
![Estado](https://img.shields.io/badge/Estado-Producción-success)

## Descripción

Esta aplicación web permite registrar, visualizar y gestionar información sobre actividades criminales y delincuentes capturados. Es una herramienta diseñada para uso interno de empresas de seguridad, departamentos legales o instituciones que requieran llevar un control digital de incidentes y reportes.

**[Ver Demo en Vivo](https://registro-actividad-criminal.onrender.com)**

## Tecnologías utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Bibliotecas:** Bootstrap 5, Font Awesome, jsPDF, jsPDF-AutoTable, SheetJS (XLSX)
- **Almacenamiento:** LocalStorage (persistencia de datos en navegador)
- **Despliegue:** Render (hosting)

## Configurar backend con Neon (PostgreSQL gratis)

Para usar la API con Neon (servidor Postgres gratuito):

1. **Crear base en Neon** y copiar la Connection String (DATABASE_URL), p. ej.:
   `postgresql://neondb_owner:PASS@ep-xxxxx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
2. **Variables de entorno del backend (`api/`)**:
   - `DATABASE_URL` = URL completa de Neon (con `sslmode=require`)
   - `PGSSL` = `1`
   - `PGPOOL_MAX` = `5` (recomendado en free tier)
   - Opcional: `PG_IDLE_TIMEOUT=30000`, `PG_CONN_TIMEOUT=10000`
3. **Despliegue**: redeploy/restart de la API para que tome los cambios. El código ya carga env con `import 'dotenv/config';` en `api/server.js` y usa `pg` en `api/db.js`.
4. **Migración de datos (opcional)** desde otra BD Postgres:
   - Exportar: `pg_dump --no-owner --format=custom --file dump.backup "<DATABASE_URL_ORIGEN>?sslmode=require"`
   - Importar: `pg_restore --no-owner --no-privileges --dbname "<DATABASE_URL_NEON>" dump.backup`
   - Si el esquema destino ya tenía objetos y hay conflictos, puede limpiarse con: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`

Ejemplo de plantilla de variables: ver `.env.example` en la raíz (incluye formato de Neon y pool recomendado).

## Funcionalidades principales

- **Registro de casos delictivos** por trimestre y empresa
- **Gestión de delincuentes capturados:** alta, visualización y almacenamiento local
- **Generación de reportes** y tablas estadísticas
- **Interfaz responsiva** adaptable para escritorio y dispositivos móviles
- **Sistema de autenticación** para proteger datos sensibles
- **Exportación de datos** en formato PDF y Excel
 - **Importación masiva (Excel)** de historial de delincuentes y productos robados

## Instalación y uso local

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

## Guía de uso

1. **Iniciar sesión:**
   - Usuario: `admin`
   - Contraseña: `SupervisorIT2025`
   - Usuario estándar (ejemplo): `usuario`
   - Contraseña estándar: `usuario123`

2. **Registrar un caso:**
   - Completa los datos de empresa, responsable, fecha y trimestre
   - Añade los casos delictivos ocurridos, su tipificación, fecha, cuantía y observaciones

3. **Agregar delincuente capturado:**
   - Haz clic en el botón `+` en la sección correspondiente
   - Completa el formulario del modal y guarda el registro
   - Los datos se almacenan en el navegador (localStorage) y se muestran en la tabla

4. **Guardar documento (Excel + PDF):**
   - Usa el botón `Guardar documento` para exportar el Excel y generar/guardar el PDF automáticamente.
   - Al finalizar, el formulario se reinicia para ingresar un nuevo registro.

5. **Actualizar Excel existente (fusión opcional):**
   - Después de guardar, el sistema ofrece seleccionar tu archivo Excel maestro para fusionar datos.
   - También puedes usar el botón `Actualizar Excel existente` en la interfaz.
   - Se descargará `<nombre>_actualizado.xlsx` con los datos acumulados.

5. **Perfil de Usuario (cambio de contraseña):**
   - Haz clic en tu nombre en la parte superior y abre **Perfil de Usuario**.
   - Cambia tu contraseña desde el modal del perfil.

6. **Panel de administración:**
   - Accede si tu rol es **admin**.
   - Gestiona usuarios y utiliza la **carga masiva**.

7. **Importación masiva (Excel):**
   - En la barra superior, botón **Importación masiva** abre `importacion-masiva.html`.
   - Descarga la plantilla y carga el Excel con hojas `Delincuentes` y/o `Productos`.
   - Los datos importados se guardan en localStorage y actualizan el Historial y el Top 20.

## Flujo de guardado y exportación

- **Guardar documento** ejecuta:
  - Exportación a Excel con descarga directa (sin diálogos del sistema).
  - Generación y guardado de PDF con fecha del sistema en el encabezado.
  - Pregunta si deseas actualizar (fusionar) un Excel maestro.
  - Reinicia el formulario dejando historiales y Top 20 intactos.

- **PDF**:
  - La tabla de "CASOS DELICTIVOS…" muestra la Tipificación en la primera columna y las Observaciones correctamente.
  - Encabezado usa la fecha actual del sistema.

- **Excel**:
  - Hoja `Encabezado`: se agrega una fila por cada guardado (histórico). No se sobrescribe.
  - Hoja `Casos`: se agregan filas nuevas en cada guardado (no se consolidan por fecha).
  - Hoja `Productos`: listado con cantidades.
  - Hoja `Delincuentes`: listado según el registro.
  - Hoja `Perdidas`: muestra los 12 meses; solo se rellenan los meses con datos del registro actual.

## Actualizar Excel existente (maestro)

Al fusionar con un Excel maestro, se aplican estas reglas:

- **Encabezado:** se mantiene el histórico y se agrega una nueva fila por guardado.
- **Perdidas:** se suma por mes (Casos y Pérdidas). Si el mes no existía, se agrega.
- **Productos:** se suma cantidad por producto (normalizando el nombre para evitar duplicados por acentos/casos).
- **Casos y Delincuentes:** se agregan filas nuevas (no se fusionan ni reemplazan).

Cómo usar la fusión:

1. Presiona `Guardar documento`.
2. Acepta la pregunta para seleccionar tu Excel maestro.
3. Selecciona el archivo `.xlsx` maestro.
4. Se descargará el archivo `<nombre>_actualizado.xlsx`. Puedes reemplazar tu maestro con este archivo.

También puedes presionar el botón `Actualizar Excel existente` en la interfaz en cualquier momento.

## Importación Masiva (Excel) de Historial y Productos

Nueva página dedicada: `importacion-masiva.html`.

### Cómo acceder

- Desde `index.html`, botón superior **Importación masiva**.

### Plantilla soportada

- Hoja `Delincuentes` (columnas sugeridas):
  - Nombre y Apellido, Cédula, Edad, Dirección, Vehículo, Placa, Color,
    Fecha Captura, Delito, Productos, Cuantía (B/.), N° Denuncia
- Hoja `Productos`:
  - Producto/Mercancía, Tipo de producto, Cantidad Total
- Se incluye hoja informativa `LeerAntes` al descargar la plantilla.

### Comportamiento al importar

- Se normalizan columnas a la estructura interna esperada por la UI.
- Si solo existe la hoja `Delincuentes`, también se vuelca al historial (`delincuentesPersistentes`).
- Se actualizan inmediatamente:
  - `Historial de Delincuentes` (persistente en `delincuentesPersistentes`).
  - `Top 20 de productos` (tabla limitada a 20 para la UI, pero el maestro conserva todo).
- Sincronizador automático: si el historial está vacío pero existe `delincuentes`, al entrar en `importacion-masiva.html` se copia a `delincuentesPersistentes`.

### Límites en UI vs Maestro

- UI muestra solo el Top 20. El Excel maestro conserva todos los productos acumulados.
- El Historial puede crecer; se recomienda usar scroll/paginación si fuese necesario.

### Pasos rápidos

1. Abrir `Importación masiva`.
2. Descargar plantilla, completar y guardar como `.xlsx`.
3. Cargar el archivo con **Importar Excel**.
4. Verificar que el Historial y el Top 20 se actualizan; queda persistente en el navegador.

## Carga masiva de usuarios (Admin)

- Disponible en el **Panel de Administración**.
- Opciones:
  - **Descargar plantilla CSV** con headers correctos.
  - **Subir CSV** o pegar **CSV/JSON** en el textarea y presionar `Cargar usuarios`.
- **Campos soportados**:
  - Obligatorios: `username`, `password`
  - Opcionales: `rol`, `nombre`, `nombreCompleto`, `correo`, `empresa`, `celular`, `activo`
  - Por defecto: `rol = usuario`, `activo = true`
- **CSV**:
  - Encabezado esperado: `username,password,rol,nombreCompleto,correo,empresa,celular,activo`
  - Delimitadores aceptados: **coma ( , )** o **punto y coma ( ; )**. El sistema autodetecta el separador.
  - Se limpian comillas envolventes.
- **Ejemplo CSV**:
  ```csv
  username,password,rol,nombreCompleto,correo,empresa,celular,activo
  juan,clave123,usuario,Juan Pérez,juan@acme.com,ACME,6000-0000,true
  ana,pass456,admin,Ana López,ana@acme.com,ACME,6111-1111,true
  ```
- **Ejemplo JSON**:
  ```json
  [
    {"username":"juan","password":"clave123","rol":"usuario","nombreCompleto":"Juan Pérez","correo":"juan@acme.com","empresa":"ACME","celular":"6000-0000","activo":true},
    {"username":"ana","password":"pass456","rol":"admin","nombreCompleto":"Ana López","correo":"ana@acme.com","empresa":"ACME","celular":"6111-1111","activo":true}
  ]
  ```
- **Backend**: endpoint `POST /users/bulk` (protegidopor rol admin). Inserta en lote, omite duplicados y devuelve `{ inserted, skipped }`.

## Notas importantes

- **Persistencia:** Los datos se guardan en el navegador del usuario (localStorage). Si borras el caché, se perderán los registros.
- **Descarga directa:** La exportación a Excel fuerza descarga directa para evitar errores de permisos.
- **Despliegue:** El sitio está publicado en Render con HTTPS habilitado para mayor seguridad.
- **Compatibilidad:** Optimizado para navegadores modernos (Chrome, Firefox, Edge, Safari).
- **Manual de usuario:** Disponible en la aplicación a través del botón de ayuda.

## Soporte y contacto

Para reportar errores, sugerencias o solicitar soporte:

- **Correo electrónico:** lboutin@outlook.es (asunto: "Reporte de Error")
- **Repositorio:** [GitHub - SupervisorIT/registro-actividad-criminal](https://github.com/SupervisorIT/registro-actividad-criminal)
- **Sitio web:** [registro-actividad-criminal.onrender.com](https://registro-actividad-criminal.onrender.com)

## Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados.

---

**Desarrollado por SupervisorIT © 2025**

## Historial de cambios

### 1.5.0 (Agosto 2025)

- Nueva página `importacion-masiva.html` para carga masiva desde Excel.
- Descarga de plantilla con hojas `Delincuentes`, `Productos` y `LeerAntes`.
- Importación que normaliza columnas y actualiza `delincuentesPersistentes` y Top 20.
- Sincronización automática del historial si está vacío.
- Actualización de documentación (README y manual de ayuda).

### 1.4.0 (Agosto 2025)

- Mejoras en exportación PDF/Excel y flujo de guardado.
- Panel de administración con carga masiva de usuarios.
