

# LED Product Comparator – Fase 1 MVP

## Visión General
Comparador inteligente de productos LED para el mercado de USA/Canadá, con interfaz bilingüe (EN/ES), dirigido a profesionales B2B. Incluye catálogo de 100+ productos, comparador lado a lado, score de conveniencia y filtrado por región.

---

## 1. Base de Datos (Supabase)

### Catálogo de Productos
- Tabla de productos con todos los campos técnicos (marca, modelo, categoría, watts, lúmenes, eficiencia, CCT, CRI, vida útil, garantía, certificaciones) y comerciales (precio, moneda, estado/provincia, canal de venta, uso)
- Precarga de ~100+ productos demo con variedad de marcas, categorías, regiones y rangos de precio
- Tabla de regiones (estados USA + provincias Canadá)

### Autenticación y Roles
- Login para administradores
- Rol de admin para gestionar productos
- Los visitantes no necesitan cuenta para usar el comparador

---

## 2. Panel de Administración

- Página protegida para agregar, editar y eliminar productos
- Formulario con todos los campos técnicos y comerciales
- Vista de tabla con búsqueda y filtros para gestionar el catálogo
- Carga masiva opcional (CSV)

---

## 3. Página Principal – Explorar Productos

- Diseño limpio estilo SaaS/B2B, profesional y ejecutivo
- Selector de región prominente (Estado USA / Provincia Canadá) que filtra todo el contenido
- Selector de idioma (EN/ES) en el header
- Grid de productos con tarjetas que muestran: imagen/icono, marca, modelo, precio, eficiencia, y badge del Convenience Score
- Filtros laterales: categoría (Bulbo, Panel, High Bay), uso (Residencial/Comercial/Industrial), marca, rango de precio, certificaciones
- Botón "Comparar" en cada tarjeta para agregar al comparador (máximo 3)
- Destacar "Producto Recomendado" con badge ⭐

---

## 4. Comparador Side-by-Side

- Vista de hasta 3 productos en columnas paralelas
- Todas las especificaciones técnicas y comerciales alineadas fila por fila
- Convenience Score destacado en cada columna con barra visual
- Diferencias resaltadas (mejor valor en verde, peor en rojo/gris)
- Etiquetas contextuales: "Mejor precio", "Mayor durabilidad", "Más eficiente"
- CTA: "¿Por qué este producto conviene más?" que expande la explicación del score

---

## 5. Convenience Score (0–100)

- Cálculo basado en fórmula ponderada:
  - Precio (peso ~30%)
  - Eficiencia energética lm/W (peso ~25%)
  - Vida útil (peso ~20%)
  - Garantía (peso ~15%)
  - Disponibilidad regional (peso ~10%)
- Score visible con número y barra de progreso de color
- Explicación desglosada: "Precio competitivo (+25), Alta eficiencia (+22), Buena garantía (+12)..."
- Mensajes contextuales por región: "Este producto es más conveniente en Texas que en California"

---

## 6. Internacionalización (EN/ES)

- Toggle de idioma en el header
- Todas las etiquetas de UI, filtros, mensajes y CTAs traducidos
- Los datos de producto (nombres, descripciones) se mantienen en inglés (mercado norteamericano)

---

## 7. Diseño y UX

- Estilo profesional B2B, colores sobrios con acentos para scores y recomendaciones
- Responsive (desktop-first, funcional en tablet/móvil)
- CTAs claros: "Ver mejor opción", "Comparar", "Por qué conviene más"
- Lenguaje de negocio, no técnico
- Header con logo, selector de región, idioma y acceso admin

