export type DemoEcommerceMerchantSlug = "floreria" | "libreria" | "marketplace";

export type DemoEcommerceProduct = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
};

export type DemoEcommerceMerchant = {
  slug: DemoEcommerceMerchantSlug;
  name: string;
  apiKey: string;
  tagline: string;
  hero: string;
  cartLabel: string;
  accentTone: "rose" | "emerald" | "amber";
  catalog: DemoEcommerceProduct[];
};

export const DEMO_ECOMMERCE_MERCHANTS: Record<DemoEcommerceMerchantSlug, DemoEcommerceMerchant> = {
  floreria: {
    slug: "floreria",
    name: "Jardin y Petalos",
    apiKey: "floreria_key", // API Key de la florería
    tagline: "Flores artesanales con entrega segura",
    hero: "Coleccion floral para ocasiones especiales",
    cartLabel: "Mi ramo",
    accentTone: "rose",
    catalog: [
      { id: "f1", name: "Ramo de rosas rojas", price: 450, emoji: "🌹", category: "Ramos" },
      { id: "f2", name: "Tulipanes silvestres", price: 320, emoji: "🌷", category: "Individual" },
      { id: "f3", name: "Girasoles premium", price: 280, emoji: "🌻", category: "Individual" },
      { id: "f4", name: "Orquidea morada", price: 680, emoji: "🪷", category: "Premium" },
      { id: "f5", name: "Bouquet primaveral", price: 520, emoji: "💐", category: "Ramos" },
      { id: "f6", name: "Lirios blancos", price: 390, emoji: "🤍", category: "Premium" },
    ],
  },
  libreria: {
    slug: "libreria",
    name: "Libreria BookSwap",
    apiKey: "XXXX", // La supuesta API Key de la librería que no funciona libreria_key
    tagline: "Catalogo curado para lectores frecuentes",
    hero: "Libros clasicos, fantasia y ciencia ficcion",
    cartLabel: "Mi estante",
    accentTone: "emerald",
    catalog: [
      { id: "l1", name: "Cien Años de Soledad", price: 180, emoji: "📖", category: "Clasicos" },
      { id: "l2", name: "El Principito", price: 120, emoji: "🌟", category: "Favoritos" },
      { id: "l3", name: "Pedro Páramo", price: 150, emoji: "📘", category: "Clasicos" },
      { id: "l4", name: "1984", price: 195, emoji: "📕", category: "Distopia" },
      { id: "l5", name: "Rayuela", price: 210, emoji: "📙", category: "Vanguardia" },
      { id: "l6", name: "Ficciones", price: 165, emoji: "📒", category: "Vanguardia" },
    ],
  },
  marketplace: {
    slug: "marketplace",
    name: "MercadoRapido",
    apiKey: "sk_comercio_2_key", // API Key del marketplace
    tagline: "Tecnologia y hogar con checkout antifraude",
    hero: "Envio veloz para compras del dia a dia",
    cartLabel: "Mi carrito",
    accentTone: "amber",
    catalog: [
      { id: "m1", name: "Audifonos bluetooth pro", price: 1299, emoji: "🎧", category: "Tecnologia" },
      { id: "m2", name: "Camara instantanea", price: 899, emoji: "📷", category: "Tecnologia" },
      { id: "m3", name: "Mochila ultralight 30L", price: 649, emoji: "🎒", category: "Outdoor" },
      { id: "m4", name: "Termo acero inox 1L", price: 349, emoji: "🫙", category: "Hogar" },
      { id: "m5", name: "Teclado mecanico RGB", price: 1599, emoji: "⌨️", category: "Tecnologia" },
      { id: "m6", name: "Silla ergonomica mesh", price: 3499, emoji: "🪑", category: "Oficina" },
    ],
  },
};

export const DEMO_ECOMMERCE_MERCHANT_ORDER: DemoEcommerceMerchantSlug[] = [
  "libreria",
  "floreria",
  "marketplace",
];

export function isDemoEcommerceMerchantSlug(value: string | null): value is DemoEcommerceMerchantSlug {
  return value === "floreria" || value === "libreria" || value === "marketplace";
}

export function formatDemoEcommercePrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}
