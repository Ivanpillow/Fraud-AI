import { DEMO_LIBRERIA_BOOKS } from "@/lib/demo-libreria-data";

export type DemoEcommerceMerchantSlug = "floreria" | "libreria" | "marketplace";

export type DemoEcommerceProduct = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
  author?: string;
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

function createUniformCatalog(
  products: Array<Pick<DemoEcommerceProduct, "id" | "name" | "price" | "category" >>,
  emoji: string
): DemoEcommerceProduct[] {
  return products.map((product) => ({
    ...product,
    emoji,
  }));
}

function createBookCatalog(emoji: string): DemoEcommerceProduct[] {
  return DEMO_LIBRERIA_BOOKS.map((book) => ({
    id: book.id,
    name: book.title,
    price: book.price,
    emoji,
    category: book.genre,
    author: book.author,
  }));
}

export const DEMO_ECOMMERCE_MERCHANTS: Record<DemoEcommerceMerchantSlug, DemoEcommerceMerchant> = {
  floreria: {
    slug: "floreria",
    name: "Florería Flowers",
    apiKey: "floreria_key", // API Key de la florería
    tagline: "Flores artesanales",
    hero: "",
    cartLabel: "Carrito de Compras",
    accentTone: "rose",
    catalog: createUniformCatalog(
      [
        { id: "f1", name: "Ramo de rosas rojas", price: 450, category: "Ramos" },
        { id: "f2", name: "Tulipanes silvestres", price: 320, category: "Individual" },
        { id: "f3", name: "Girasoles premium", price: 280, category: "Individual" },
        { id: "f4", name: "Orquídea morada", price: 680, category: "Premium" },
        { id: "f5", name: "Bouquet primaveral", price: 520, category: "Ramos" },
        { id: "f6", name: "Lirios blancos", price: 390, category: "Premium" },
        { id: "f7", name: "Caja de lirios pastel", price: 410, category: "Premium" },
        { id: "f8", name: "Arreglo minimalista", price: 360, category: "Moderno" },
      ],
      "🌸"
    ),
  },
  libreria: {
    slug: "libreria",
    name: "Librería BookSwap",
    apiKey: "libreria_api_key", // La supuesta API Key de la librería que no funciona libreria_key
    tagline: "Catálogo de libros varios",
    hero: "",
    cartLabel: "Carrito de Compras",
    accentTone: "emerald",
    catalog: createBookCatalog("📖"),
  },
  marketplace: {
    slug: "marketplace",
    name: "Marketplace",
    apiKey: "sk_comercio_2_key", // API Key del marketplace
    tagline: "Tecnología/Hogar",
    hero: "",
    cartLabel: "Carrito de Compras",
    accentTone: "amber",
    catalog: [
      { id: "m1", name: "Audífonos bluetooth pro", price: 1299, emoji: "🎧", category: "Tecnología" },
      { id: "m2", name: "Cámara instantanea", price: 899, emoji: "📷", category: "Tecnología" },
      { id: "m3", name: "Mochila ultralight 30L", price: 649, emoji: "🎒", category: "Exteriores" },
      { id: "m4", name: "Termo acero inox 1L", price: 349, emoji: "🫙", category: "Hogar" },
      { id: "m5", name: "Teclado mecánico RGB", price: 1599, emoji: "⌨️", category: "Tecnología" },
      { id: "m6", name: "Silla ergonómica mesh", price: 3499, emoji: "🪑", category: "Oficina" },
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
