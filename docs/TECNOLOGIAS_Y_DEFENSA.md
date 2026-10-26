# Tecnologías y argumentos para la defensa

**Autor:** Roberto Emanuel Tito Fernandez · **Fecha:** 26 de octubre de 2026.

## Funcionalidad principal

DonaApp centraliza las necesidades de organizaciones y registra aportes en especie para seguirlos desde su registro hasta la recepción confirmada. El donante conoce el destino y el estado de su aporte; coordinación puede revisarlo y dejar constancia de la entrega. El enfoque universitario acota el conjunto de organizaciones a las que se incorporen al proyecto, sin afirmar cobertura de toda Cochabamba.

## Arquitectura implementada

El navegador ejecuta React. Axios envía solicitudes HTTP a una API Express. Express verifica el JWT, valida los datos y consulta SQLite. La respuesta JSON actualiza las pantallas. Las fotografías se guardan en una carpeta del backend; la base guarda su ruta. El navegador no abre directamente la base ni decide los permisos de lectura y escritura.

Ejemplo: al enviar 2 chamarras para una necesidad, el frontend envía datos y fotografía con `multipart/form-data`. La API valida el tipo, el destino y la cantidad; guarda una donación con estado registrada y su primer evento. Coordinación aprueba y luego confirma la entrega. Solo en ese momento las 2 unidades se suman al avance público de esa necesidad.

## Elecciones y comparaciones

| Tecnología utilizada | Para qué se usa | Por qué conservarla en este avance | Alternativa y diferencia |
|---|---|---|---|
| JavaScript y JSX | Lógica del navegador y del servidor; vistas React | Continúan la base original y permiten trabajar con un lenguaje en ambas capas | TypeScript añade comprobación estática; sería útil al ampliar entidades y equipo, pero requiere tipar la base existente |
| React 18 | Componentes, formularios, estado y actualización de pantallas | Reutiliza tarjetas, campos y avisos; actualiza filtros y panel sin recargar páginas | HTML/JS directo requiere gestionar manualmente más estado; Angular aporta una estructura más prescriptiva con mayor cambio respecto al repositorio |
| Vite 5 | Servidor de desarrollo, transformación de JSX y compilación | Ya forma parte del proyecto y permite generar los archivos para distribuir el frontend | Next.js añade capacidades de servidor y renderizado que este avance no usa; cambiar implicaría otra arquitectura |
| CSS propio | Diseño adaptable, colores, tarjetas, formularios y componentes | Centraliza la identidad visual; se retiró Tailwind del proyecto original porque las nuevas pantallas ya usan clases de diseño propias | Tailwind permite componer utilidades; Bootstrap trae componentes listos. Mantener ambas capas aquí añadiría dependencias sin uso |
| React Router 6 | Rutas Inicio, Necesidades, Organizaciones, Donar y Panel | Mantiene navegación interna y rutas protegidas, conserva el destino al ingresar | Varias páginas HTML necesitarían resolver por separado sesión y navegación |
| Axios | Solicitudes a la API, manejo de errores y adjuntos | Centraliza la URL, el token y el tiempo de espera; ya estaba instalado | `fetch` nativo puede hacer lo mismo con menos dependencias; Axios evita reescribir la integración actual |
| Lucide React | Iconos vectoriales | Iconos consistentes que se empaquetan con la aplicación y se escalan sin perder nitidez | Emojis cambian de apariencia según el sistema; una biblioteca adicional de iconos duplicaría recursos |
| Node.js | Ejecutar JavaScript en el servidor | Comparte lenguaje con el frontend y es compatible con el backend existente | Python/Django o PHP/Laravel también funcionan, pero implicarían reescribir la lógica actual |
| Express 4 | API REST, rutas y middleware | Permite separar autenticación, controladores y acceso a datos con una estructura conocida | NestJS puede ordenar una aplicación mayor con módulos e inyección; su complejidad no se justifica todavía en este alcance |
| SQLite 3 mediante sqlite3 | Usuarios, organizaciones, necesidades, aportes e historial | Persiste datos en un archivo local y facilita una presentación sin instalar un servidor de BD | PostgreSQL facilita despliegues con varios servidores y mayor concurrencia de escritura; implica administrar otro servicio |
| JWT mediante jsonwebtoken | Token firmado con identidad y rol | Permite verificar cada solicitud protegida de la API sin aceptar el rol enviado en el formulario | Sesiones con cookies HttpOnly facilitan revocación y protección del token frente a scripts; requieren almacenamiento/configuración de sesiones y CSRF |
| bcryptjs | Hash de contraseñas con salt | Evita guardar contraseñas legibles y mantiene compatibilidad con usuarios existentes | Argon2id es una opción para una revisión futura; requiere planificar compatibilidad y migración de hashes |
| Multer 2 | Recibir imágenes multipart | Se actualizó desde Multer 1 y limita el tamaño y tipos declarados de archivo | Almacenamiento de objetos sería conveniente en hosting distribuido, pero requiere otro servicio e integración |
| dotenv y CORS | Configuración por entorno y origen permitido | Separan URL y secreto del código, y permiten conectar el frontend previsto | CORS no sustituye autenticación ni impide por sí mismo llamadas fuera del navegador |
| Node Test Runner | Pruebas de API con SQLite en memoria | No añade un framework de pruebas; verifica reglas de negocio, permisos y métricas | Jest/Vitest aportan más herramientas; no son necesarios para estos escenarios de API |
| Git y GitHub | Versionado y revisión de cambios | Permiten mostrar avances y conservar evidencia de decisiones | Un ZIP facilita la entrega, pero no sustituye historial ni revisión en el repositorio |

Las versiones exactas instaladas están fijadas por `package-lock.json`. Se conserva la familia de versiones del proyecto con actualización de Multer y fijación de Vite 5.4.20; no se afirma que sean las versiones más nuevas. La herramienta de formato Prettier es de desarrollo y no forma parte del sistema que usa el donante.

**Precisiones:** REST es un estilo de diseño de API; HTTP es el protocolo de comunicación; JSON es el formato de datos; JWT es un formato de token y no cifra por sí mismo los datos. bcrypt genera hashes, no contraseñas reversiblemente encriptadas. DonaApp es una aplicación web adaptable, no una aplicación Android/iOS.

## Por qué SQLite ahora

Para una defensa en una computadora, el archivo local simplifica instalación, copias y demostraciones. No hace falta contratar una base de datos para validar el flujo. SQLite tampoco está limitado exclusivamente a prototipos: su adecuación depende de concurrencia, almacenamiento y arquitectura. En un despliegue con varios servidores o más exigencia de escritura simultánea, evaluaría PostgreSQL. No migraría solo por el número de usuarios sin medir el uso.

## Decisiones del avance

- Se mantiene la API `/orphanages` y la tabla original para conservar compatibilidad; la interfaz presenta “organizaciones” y añade categoría.
- Los roles internos originales se conservan. `orfanato` representa una organización, aunque el nombre técnico sea heredado. Solo ve organizaciones asociadas a su `user_id`.
- Solo coordinación publica y cierra necesidades en esta entrega. Esto evita que una cuenta de organización publique necesidades para destinos ajenos. El registro público siempre crea donantes.
- Se usa revisión manual de artículos, sin afirmar inteligencia artificial. Antes se calculaba una puntuación leyendo palabras; no se analizaban imágenes.
- Los aportes son en especie. Se excluye el cobro monetario hasta definir cuentas institucionales, conciliación, proveedor y responsabilidades.
- La identidad visual propuesta usa verdes, crema y lima para vincular solidaridad y comunidad; acentos por causa ayudan a distinguir categorías. No se reemplaza ni inventa el logotipo institucional oficial.

## Costos de esta entrega

| Concepto | Escenario de presentación local |
|---|---|
| Licencias de las herramientas del stack | No requiere contratar licencias de uso para ejecutar este código y sus dependencias de código abierto; conservar avisos de licencia de las dependencias |
| Base y fotografías | Se almacenan en el disco del equipo; consumen su espacio y requieren respaldo |
| Hosting y dominio | No se contratan para ejecutar en localhost |
| Pasarela, SMS y servicios de IA | No están integrados; no generan cargos desde esta aplicación |
| Desarrollo y mantenimiento | Requieren tiempo del equipo, aunque no se cobre una licencia |

Esto significa **sin gasto adicional de hosting para la demostración local**, no costo total cero: equipo, conexión, energía y trabajo tienen un costo. Para publicación real hay que cotizar servidor con almacenamiento persistente, copias, dominio y servicios de envío. No se fijan tarifas de proveedores que no fueron contratados ni verificados para este despliegue. GitHub Pages solo aloja contenido estático; no ejecuta este backend.

## Siguiente entrega razonable

1. Validar con Fundación Unifranz el proceso, responsables, organizaciones y uso de marca.
2. Aprovisionamiento de cuentas de organizaciones y asignación administrativa desde una pantalla propia; actualmente se conservan las cuentas originales y las de demo.
3. Recuperación de contraseña, controles de intentos, revisión de sesiones y revocación.
4. Coordinar recepción con agenda y puntos de entrega confirmados.
5. Despliegue piloto con HTTPS, copias verificadas, almacenamiento persistente y auditoría de dependencias.
6. Evaluar dinero/QR únicamente con un flujo institucional y conciliación comprobable.

Antes de producción también se necesita validar el contenido real de las imágenes (el filtro actual usa el tipo declarado), revisar carga de archivos no vinculados cuando un registro falla, paginar listados y probar concurrencia/carga. La actualización de estado y la inserción del evento son escrituras separadas: un fallo de almacenamiento intermedio requiere reconciliación; para operación real conviene una transacción con manejo de concurrencia. No se presenta este avance como listo para explotación pública.

## Guion breve para explicar al docente

“Mi sistema usa React para las pantallas y Node.js con Express para las reglas del negocio. Los datos se conservan en SQLite, lo que permite ejecutar la demostración local sin contratar un servidor de base de datos. El flujo principal registra una donación, permite revisarla y confirma su entrega; cada cambio queda en el historial. El donante ve sus propios aportes y coordinación administra el conjunto. Conservé las tecnologías del repositorio para mostrar evolución real, mejorando diseño, validación y trazabilidad. La revisión de prendas es manual y las donaciones monetarias están fuera de este avance.”

## Fuentes oficiales

- React: https://react.dev/learn
- Vite: https://vite.dev/guide/
- Express: https://expressjs.com/
- SQLite, usos apropiados: https://www.sqlite.org/whentouse.html
- React Router: https://reactrouter.com/6.30.1
- Multer: https://github.com/expressjs/multer
- Node Test Runner: https://nodejs.org/api/test.html

La identificación de tecnologías se comprobó en el código y los manifiestos del repositorio, no solamente en su README.
