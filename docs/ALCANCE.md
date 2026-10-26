# Alcance del avance

## Problema que resuelve

Los aportes dispersos dificultan identificar qué necesita una organización y comprobar si recibió lo ofrecido. El sistema centraliza necesidades y aporta seguimiento por registro.

## Actores

| Actor | Acciones implementadas |
|---|---|
| Visitante | Ver portada, organizaciones, necesidades y progreso de entregas; buscar y filtrar |
| Donante | Crear cuenta, ingresar, registrar aportes e imágenes, consultar su panel, historial y CSV |
| Coordinación (`admin`) | Crear/editar organizaciones, eliminar las que no tienen relaciones, publicar/cerrar/reabrir necesidades, revisar aportes y confirmar entregas, consultar el conjunto |
| Organización (`orfanato`) | Consultar y revisar aportes de los destinos previamente asignados a su usuario |

El frontend oculta acciones según rol y el backend verifica los permisos. Cambiar un rol guardado en el navegador no autoriza solicitudes al servidor.

## Criterios de aceptación

- Cantidad entera positiva entre 1 y 100000; destino existente y descripción no vacía.
- Si se elige una necesidad, debe coincidir con organización y tipo y estar pendiente.
- Estados válidos: registrada → aprobada → entregada; se admite rechazo desde registrada o aprobada con motivo.
- Entregada y rechazada son estados terminales en este avance.
- Un donante no lee donaciones ajenas ni sus imágenes; las organizaciones se limitan a sus destinos asignados.
- El historial guarda fecha, estado y observación. No inventa eventos para registros anteriores.
- Las cantidades de necesidad provienen de entregas confirmadas vinculadas a ella.
- El CSV exporta el filtro actual, con escapado y prevención de interpretación de fórmulas.
- La interfaz permite navegación y formularios desde celular, muestra errores y evita doble envío mientras guarda.

## Datos y relaciones

Usuarios → Donaciones ← Organizaciones. Las organizaciones publican necesidades mediante coordinación. Una donación puede apuntar a una necesidad concreta. Cada donación nueva genera eventos que guardan el actor interno y sus observaciones. Las tablas conservan sus nombres históricos para no romper la base anterior.

No hay registro individual de menores, expedientes de animales, seguimiento por geolocalización, certificaciones fiscales ni integración bancaria. Los textos DEMO son datos ilustrativos. La universidad y sus aliados deben validar los nombres, horarios y contactos antes de reemplazarlos por datos reales.

## Integración con la versión anterior

La base anterior no se incluye en el ZIP. El código de migración añade `categoria`, `user_id` e historial y activa claves foráneas. Antes de aplicar sobre datos reales: hacer respaldo, revisar referencias huérfanas y probar en una copia. Se mantienen las contraseñas existentes. Las cuentas del README son solo de una instalación demo vacía.
