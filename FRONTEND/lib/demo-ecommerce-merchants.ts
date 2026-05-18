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
    name: "Flowers",
    apiKey: "floreria_key",
    tagline: "Arreglos florales premium para cada ocasión",
    hero: "Flores frescas a tu puerta",
    cartLabel: "Tu carrito",
    accentTone: "rose",
    catalog: createUniformCatalog(
      [
        { id: "f1", name: "Ramo de Rosas Rojas Premium", price: 450, category: "Ramos" },
        { id: "f2", name: "Tulipanes Holandeses Importados", price: 380, category: "Individual" },
        { id: "f3", name: "Girasoles Naturales", price: 280, category: "Individual" },
        { id: "f4", name: "Orquídea Blanca Tailandesa", price: 680, category: "Premium" },
        { id: "f5", name: "Bouquet Primaveral Mixto", price: 520, category: "Ramos" },
        { id: "f6", name: "Lirios Blancos Franceses", price: 420, category: "Premium" },
        { id: "f7", name: "Arreglo de Peonías Pastel", price: 520, category: "Premium" },
        { id: "f8", name: "Composición Minimalista Moderna", price: 380, category: "Moderno" },
      ],
      "✿"
    ),
  },
  libreria: {
    slug: "libreria",
    name: "BookSwap",
    apiKey: "libreria_api_key",
    tagline: "Descubre lecturas que transforman",
    hero: "Tu librería independiente favorita",
    cartLabel: "Mis libros",
    accentTone: "emerald",
    catalog: createBookCatalog("📕"),
  },
  marketplace: {
    slug: "marketplace",
    name: "ElectroHub",
    apiKey: "marketplace_key",
    tagline: "Tecnología y lifestyle para tu estilo de vida",
    hero: "Los mejores productos al mejor precio",
    cartLabel: "Tu carrito",
    accentTone: "amber",
    catalog: [
      { id: "m1", name: "Audífonos Inalámbricos Pro Max", price: 1299, emoji: "◉", category: "Tecnología" },
      { id: "m2", name: "Cámara Instantánea Fujifilm", price: 899, emoji: "◉", category: "Fotografía" },
      { id: "m3", name: "Mochila Técnica Ultralight 30L", price: 649, emoji: "◉", category: "Exteriores" },
      { id: "m4", name: "Termo Acero Inoxidable Premium", price: 349, emoji: "◉", category: "Hogar" },
      { id: "m5", name: "Teclado Mecánico Gaming RGB", price: 1599, emoji: "◉", category: "Gaming" },
      { id: "m6", name: "Silla Ergonómica de Oficina", price: 2299, emoji: "◉", category: "Oficina" },
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
