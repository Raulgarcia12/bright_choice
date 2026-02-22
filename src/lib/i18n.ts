export type Language = 'en' | 'es';

const translations = {
  en: {
    // Header
    appName: 'LED Comparator',
    selectRegion: 'Select Region',
    allRegions: 'All Regions',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    language: 'Language',

    // Filters
    filters: 'Filters',
    category: 'Category',
    allCategories: 'All Categories',
    useType: 'Use Type',
    allUseTypes: 'All Uses',
    brand: 'Brand',
    allBrands: 'All Brands',
    priceRange: 'Price Range',
    certifications: 'Certifications',
    clearFilters: 'Clear Filters',

    // Categories
    Bulb: 'Bulb',
    Panel: 'Panel',
    'High Bay': 'High Bay',
    Linear: 'Linear',
    Downlight: 'Downlight',
    'Flood Light': 'Flood Light',
    'Area Light': 'Area Light',
    Canopy: 'Canopy',
    'Parking Structure': 'Parking Structure',
    Bollard: 'Bollard',
    'Wall Pack': 'Wall Pack',
    'Vapor Tight': 'Vapor Tight',
    'Surface Mount': 'Surface Mount',
    Specialty: 'Specialty',
    Troffer: 'Troffer',
    'Street Light': 'Street Light',
    Retrofit: 'Retrofit',
    'Track Light': 'Track Light',

    // Use types
    Residential: 'Residential',
    Commercial: 'Commercial',
    Industrial: 'Industrial',

    // Product card
    compare: 'Compare',
    remove: 'Remove',
    recommended: 'Recommended',
    convenienceScore: 'Convenience Score',
    efficiency: 'Efficiency',
    warranty: 'Warranty',
    years: 'years',
    hours: 'hours',
    lifespan: 'Lifespan',

    // Comparator
    comparator: 'Comparator',
    compareProducts: 'Compare Products',
    addProducts: 'Add products to compare (max 3)',
    noProductsToCompare: 'Select products from the catalog to compare',
    clearAll: 'Clear All',
    bestPrice: 'Best Price',
    bestEfficiency: 'Most Efficient',
    bestDurability: 'Longest Life',
    bestWarranty: 'Best Warranty',
    whyBetter: 'Why is this product better?',

    // Score breakdown
    priceScore: 'Competitive price',
    efficiencyScore: 'High efficiency',
    lifespanScore: 'Long lifespan',
    warrantyScore: 'Good warranty',
    availabilityScore: 'Regional availability',
    regionalMessage: 'This product is more convenient in {region1} than in {region2}',

    // Specs
    watts: 'Watts',
    lumens: 'Lumens',
    cct: 'CCT',
    cri: 'CRI',
    price: 'Price',
    salesChannel: 'Sales Channel',
    region: 'Region',
    model: 'Model',

    // Sales channels
    Distributor: 'Distributor',
    Retail: 'Retail',
    Online: 'Online',

    // Admin
    adminPanel: 'Admin Panel',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this product?',
    productSaved: 'Product saved successfully',
    productDeleted: 'Product deleted successfully',
    email: 'Email',
    password: 'Password',
    loginTitle: 'Admin Login',
    loginError: 'Invalid credentials',

    // General
    products: 'Products',
    noResults: 'No products found',
    loading: 'Loading...',
    viewBestOption: 'View Best Option',
    showingProducts: 'Showing {count} products',
    country: 'Country',
    usa: 'USA',
    canada: 'Canada',
  },
  es: {
    appName: 'Comparador LED',
    selectRegion: 'Seleccionar Región',
    allRegions: 'Todas las Regiones',
    admin: 'Admin',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    language: 'Idioma',

    filters: 'Filtros',
    category: 'Categoría',
    allCategories: 'Todas las Categorías',
    useType: 'Tipo de Uso',
    allUseTypes: 'Todos los Usos',
    brand: 'Marca',
    allBrands: 'Todas las Marcas',
    priceRange: 'Rango de Precio',
    certifications: 'Certificaciones',
    clearFilters: 'Limpiar Filtros',

    Bulb: 'Bulbo',
    Panel: 'Panel',
    'High Bay': 'High Bay',
    Linear: 'Lineal',
    Downlight: 'Downlight',
    'Flood Light': 'Reflectores',
    'Area Light': 'Luz de Área',
    Canopy: 'Canopy',
    'Parking Structure': 'Estacionamiento',
    Bollard: 'Bolardo',
    'Wall Pack': 'Wall Pack',
    'Vapor Tight': 'Vapor Tight',
    'Surface Mount': 'Montaje Superficial',
    Specialty: 'Especialidad',
    Troffer: 'Troffer',
    'Street Light': 'Alumbrado Público',
    Retrofit: 'Retrofit',
    'Track Light': 'Riel de Iluminación',

    Residential: 'Residencial',
    Commercial: 'Comercial',
    Industrial: 'Industrial',

    compare: 'Comparar',
    remove: 'Quitar',
    recommended: 'Recomendado',
    convenienceScore: 'Score de Conveniencia',
    efficiency: 'Eficiencia',
    warranty: 'Garantía',
    years: 'años',
    hours: 'horas',
    lifespan: 'Vida Útil',

    comparator: 'Comparador',
    compareProducts: 'Comparar Productos',
    addProducts: 'Agrega productos para comparar (máx. 3)',
    noProductsToCompare: 'Selecciona productos del catálogo para comparar',
    clearAll: 'Limpiar Todo',
    bestPrice: 'Mejor Precio',
    bestEfficiency: 'Más Eficiente',
    bestDurability: 'Mayor Durabilidad',
    bestWarranty: 'Mejor Garantía',
    whyBetter: '¿Por qué conviene más este producto?',

    priceScore: 'Precio competitivo',
    efficiencyScore: 'Alta eficiencia',
    lifespanScore: 'Larga vida útil',
    warrantyScore: 'Buena garantía',
    availabilityScore: 'Disponibilidad regional',
    regionalMessage: 'Este producto es más conveniente en {region1} que en {region2}',

    watts: 'Watts',
    lumens: 'Lúmenes',
    cct: 'CCT',
    cri: 'CRI',
    price: 'Precio',
    salesChannel: 'Canal de Venta',
    region: 'Región',
    model: 'Modelo',

    Distributor: 'Distribuidor',
    Retail: 'Retail',
    Online: 'En Línea',

    adminPanel: 'Panel de Administración',
    addProduct: 'Agregar Producto',
    editProduct: 'Editar Producto',
    deleteProduct: 'Eliminar Producto',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirmDelete: '¿Estás seguro de que deseas eliminar este producto?',
    productSaved: 'Producto guardado exitosamente',
    productDeleted: 'Producto eliminado exitosamente',
    email: 'Correo electrónico',
    password: 'Contraseña',
    loginTitle: 'Inicio de Sesión Admin',
    loginError: 'Credenciales inválidas',

    products: 'Productos',
    noResults: 'No se encontraron productos',
    loading: 'Cargando...',
    viewBestOption: 'Ver Mejor Opción',
    showingProducts: 'Mostrando {count} productos',
    country: 'País',
    usa: 'EE.UU.',
    canada: 'Canadá',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language, params?: Record<string, string | number>): string {
  let text: string = (translations[lang] as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
