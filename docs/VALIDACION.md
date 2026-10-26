# Validación del avance

**Fecha:** 26 de octubre de 2026. Las verificaciones corresponden al código de este paquete.

| Verificación | Resultado |
|---|---|
| Instalación de frontend con `npm ci --offline` después de descargar las dependencias | Correcta; manifiesto y lock consistentes |
| Compilación `npm run build` | Correcta con Vite 5.4.20; genera HTML, CSS y JavaScript |
| API: acceso anónimo y roles | Correcto; respuestas 401/403 según permiso |
| Registro público y privacidad entre donantes | Correctos; no permite crear administrador públicamente ni leer registros ajenos |
| Datos de donación | Rechaza cantidad negativa y necesidad incompatible; registra aportes válidos |
| Ámbito de organización | Restringe lectura y cambios a organizaciones asociadas al usuario |
| Estados e historial | Impide saltos y cambios terminales; exige motivo de rechazo; registra tres etapas del flujo completo |
| Métricas y progreso | Calcula unidades entregadas y restringe los indicadores privados al usuario o ámbito autorizado |
| Organizaciones | Crea, edita y elimina sin relaciones; impide borrar destinos con necesidades/donaciones |
| Imágenes | Rechaza tipo declarado no admitido y más de 5 MB; lectura válida solo con permiso |
| Migración | Añade categoría/asignación y conserva organización y hash previo; repetición idempotente en la base de prueba |
| Navegador de escritorio | Flujo de selección de necesidad, registro de cuenta, aporte, aprobación, entrega e historial completado |
| Destino tras iniciar sesión | Conserva organización y necesidad elegidas antes de registrarse |
| Exportación CSV | Descarga correcta con las filas filtradas y estado entregada |
| Navegador a 390 px | Inicio, Necesidades, Organizaciones, Donar y Panel sin desbordamiento horizontal del documento |
| Errores de ejecución del navegador durante el recorrido | Ningún `pageerror` observado |

La revisión visual incluyó portada, tarjetas de necesidades en celular y panel de escritorio. El runner de Node reportó **16 resultados aprobados y 0 fallos**: 14 escenarios de API, su prueba contenedora y una prueba independiente de migración.

## Repetir las pruebas incluidas

Desde `backend`: `npm test`. Usan SQLite en memoria y una base temporal para migración. La prueba de imágenes elimina su archivo de muestra. No modifica `dona_app.sqlite` de trabajo.

Desde `frontend`: `npm ci` y `npm run build`.

Para el recorrido manual, seguir el guion de README. El motor de navegador y los archivos temporales de inspección no se incluyen en el paquete ni son dependencias de la aplicación.

## Límites de esta validación

- No se ejecutó sobre la base binaria original del repositorio ni sobre datos reales de instituciones.
- No incluye pruebas de carga, auditoría externa, certificación WCAG, todos los navegadores ni dispositivos físicos.
- `INICIAR_WINDOWS.bat` se revisó como ayuda de arranque; no se ejecutó en Windows.
- La compilación correcta no equivale a un despliegue público. Los pendientes para ese escenario están en la guía de tecnologías.
- No se realizaron cobros, entregas físicas ni comunicaciones con terceros; el recorrido usó datos de demostración.
