# Validación de la edición autónoma

Fecha: 26 de octubre de 2026.

La aplicación compilada se sirvió mediante un servidor estático local, sin iniciar Express. El recorrido de navegador verificó:

- Portada y enlace interno de explicación del proceso.
- Registro de un donante conservando la necesidad elegida antes de ingresar.
- Registro de donación con fotografía de muestra guardada en IndexedDB.
- Persistencia de registros al recargar y lectura de la imagen.
- Listado propio de otro donante, sin el aporte de la primera cuenta.
- Consulta desde una organización asignada.
- Aprobación, entrega y tres eventos en el historial desde coordinación.
- Exportación CSV con la entrega registrada.
- Avance de 3 unidades sobre una necesidad de 30.
- Publicación y cierre de necesidades.
- Creación, edición y eliminación de una organización sin relaciones.
- Cinco pantallas a 390 px sin desbordamiento horizontal del documento.
- Publicación bajo /DonaApp/ y /OtroRepo/ sin cambiar archivos.
- Ausencia de errores JavaScript y de solicitudes a servidores externos durante el recorrido.

También se comprobó el frontend en modo API, con Express y SQLite: dos contextos de navegador independientes accedieron al mismo aporte del servidor. El donante lo registró, coordinación confirmó la entrega y el donante consultó el resultado. El modo API no muestra la etiqueta de datos locales.

Las verificaciones usaron datos ficticios. La configuración de Codespaces se revisó, pero no se creó un Codespace remoto. No se realizó un despliegue en GitHub Pages desde esta conversación. Los permisos del conector del repositorio siguen siendo de lectura. Las verificaciones no equivalen a pruebas de carga, certificación de seguridad ni ensayos en todos los navegadores.
