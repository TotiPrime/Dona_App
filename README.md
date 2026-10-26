# DonaApp · versión directa para GitHub Pages

Proyecto Integrador de **Roberto Emanuel Tito Fernandez**. Esta edición conserva las pantallas y los flujos del avance, con una implementación autónoma para demostración en un sitio estático.

## Publicar sin editar archivos

1. Extraer el ZIP y copiar **el contenido** de `DonaApp_GitHub_Directo` al repositorio. `index.html` y `assets` deben quedar en la raíz.
2. En GitHub, seleccionar **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
3. Esperar la publicación y abrir la dirección que indique Pages.

Para `TotiPrime/DonaApp`: https://totiprime.github.io/DonaApp/

El sitio ya está compilado. No requiere Render, credenciales de servicios externos, variables de entorno, instalación de Node o comandos de build para esta primera publicación. GitHub exige seleccionar la fuente de Pages una vez por repositorio. Si prefieres GitHub Actions o ya lo tenías activado, también se incluye `.github/workflows/deploy.yml`, que compila y publica esta misma edición sin variables adicionales.

Se incluyen `index.html`, `assets` y `.nojekyll` en la raíz. La navegación usa rutas con `#` y los recursos usan rutas relativas, por lo que el sitio admite otros nombres de repositorio. La carpeta `frontend` contiene el código editable. La carpeta `backend` conserva el servidor original.

## Funciones disponibles en la demostración

- Registro e inicio de sesión con cuentas locales.
- Roles de coordinación, donante y organización.
- Consulta y CRUD de organizaciones desde coordinación.
- Publicación, cierre y reapertura de necesidades.
- Categorías de infancia, animales y comunidad, búsqueda y filtros.
- Registro de aportes con fotografía opcional de hasta 5 MB.
- Validación de cantidades, destino y necesidad relacionada.
- Aprobación, rechazo con motivo y confirmación de entrega.
- Historial, métricas y progreso de necesidades a partir de entregas confirmadas.
- Exportación de CSV filtrado.
- Diseño adaptable, mensajes de error y cuadros explicativos.

## Dónde se guardan los datos

Esta edición usa **IndexedDB en el navegador**. Los registros y las imágenes sobreviven a las recargas normales. Cada navegador y ruta de sitio tienen una base independiente. Borrar los datos del sitio, usar otro perfil o cambiar de dirección no conserva esa misma base. No hay sincronización automática entre equipos, y el navegador puede eliminar almacenamiento según sus políticas.

Para demostrar el recorrido, registra un aporte como donante, cierra sesión e ingresa como coordinación **en el mismo navegador y dirección**. Los roles aplican reglas dentro de la demo, pero alguien con acceso al navegador puede inspeccionar o modificar su almacenamiento. No constituyen autorización segura de servidor.

Las contraseñas locales se guardan como hashes PBKDF2 con salt. Las sesiones de demo caducan a las ocho horas. Las tres cuentas de muestra son públicas y sirven exclusivamente para presentar el proyecto. No usar datos personales reales.

## Cuentas de muestra

| Rol | Correo | Contraseña |
|---|---|---|
| Coordinación | admin@donaapp.com | Demo2026! |
| Donante | donante@donaapp.com | Demo2026! |
| Organización | orfanato@donaapp.com | Demo2026! |

Las organizaciones y necesidades iniciales son ficticias. Los indicadores de aportes empiezan en cero.

## Diferencia respecto al backend original

| Aspecto | Edición de Pages | Backend conservado |
|---|---|---|
| Datos | IndexedDB del navegador | SQLite en el servidor |
| Alcance | Un navegador y sitio | Clientes conectados a la misma API |
| Permisos | Simulación local | Comprobaciones en Express |
| Imágenes | Blobs locales | Archivos del servidor |
| Contraseñas | PBKDF2 local | bcryptjs |
| Sesión | Token de demo local | JWT firmado por la API |
| Hosting necesario | Estático | Servidor Node con persistencia |

GitHub Pages no ejecuta Express ni SQLite. Por eso esta edición mantiene las operaciones de demostración mediante almacenamiento local. Los cobros monetarios y la IA real siguen fuera del alcance.

## Editar y recompilar en una futura entrega

Requiere Node.js con npm:

```sh
npm --prefix frontend ci
npm run build
```

`npm run build` genera el frontend y copia sus archivos a la raíz. También se incluye `ACTUALIZAR_PAGINA_WINDOWS.bat`. Después, subir los cambios a GitHub. Estos pasos no son necesarios para publicar el ZIP inicial.

Para desarrollo: `npm run dev` después de instalar las dependencias del frontend.

## Usar la API original en el futuro

`backend` conserva sus rutas, validaciones, SQLite y pruebas. El frontend utiliza la API cuando se define `VITE_API_URL` durante la compilación. Sin esa variable, utiliza IndexedDB. Cambiar a API requiere desplegar el servidor, configurar la URL y CORS, y recompilar. Las bases de ambas modalidades son independientes y no se migran automáticamente.

## Incorporar esta edición al repositorio existente

Copiar el contenido sobre la carpeta de trabajo vinculada a GitHub, aceptar los reemplazos y ejecutar desde la raíz:

```sh
git add .
git commit -m "Version autonoma para GitHub Pages"
git push
```

Si creaste manualmente `.github/workflows/deploy.yml` con las instrucciones anteriores, acepta su reemplazo por el incluido en esta entrega. La edición admite la publicación desde main/(root) o con el workflow autónomo incluido.

## Opción con el backend completo: GitHub Codespaces

Después de subir el contenido, abrir **Code → Codespaces → Create codespace on main**. La configuración incluida instala dependencias y arranca frontend y backend. Abrir el puerto **5173** en **Ports** si la ventana de la aplicación no aparece automáticamente. No se requieren cambios de código ni secretos manuales para los datos ficticios de esta demostración.

En Codespaces el frontend se conecta a Express mediante un proxy, con SQLite e imágenes en el entorno del proyecto. Quienes accedan a ese mismo entorno usan su base común. La disponibilidad depende de que el Codespace esté en ejecución y de los permisos de acceso al puerto. Por defecto el acceso puede ser privado. La plataforma tiene cuotas y condiciones de uso propias, y esta opción no equivale a hosting permanente. Borrar el Codespace elimina su almacenamiento.

Las credenciales demo son las mismas. El servidor conserva la implementación previa con JWT, bcryptjs y validaciones en Express. Las bases de Pages y Codespaces son independientes.

La configuración se revisó y el modo API se comprobó localmente. No se creó un Codespace remoto desde esta conversación. Referencia oficial: https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
