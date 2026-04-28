"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Flower2,
  Minus,
  Package2,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FraudAiLoginFloatingButton from "@/components/demo-libreria/fraudai-login-floating-button";
import { cn } from "@/lib/utils";
import {
  DEMO_ECOMMERCE_MERCHANT_ORDER,
  DEMO_ECOMMERCE_MERCHANTS,
  formatDemoEcommercePrice,
  isDemoEcommerceMerchantSlug,
  type DemoEcommerceMerchant,
  type DemoEcommerceMerchantSlug,
  type DemoEcommerceProduct,
} from "@/lib/demo-ecommerce-merchants";
import {
  countDemoEcommerceItems,
  getDemoEcommerceMerchantCart,
  getEmptyDemoEcommerceCartState,
  loadDemoEcommerceCart,
  saveDemoEcommerceCart,
  type DemoEcommerceCartState,
} from "@/lib/demo-ecommerce-cart";
import {
  calcDemoEcommerceSubtotal,
  proceedToDemoEcommerceCheckout,
  type DemoEcommerceCartLine,
} from "@/lib/demo-ecommerce-checkout-bridge";

type CartLineWithProduct = DemoEcommerceProduct & { qty: number };

const MERCHANT_ICONS: Record<DemoEcommerceMerchantSlug, LucideIcon> = {
  floreria: Flower2,
  libreria: BookOpen,
  marketplace: Package2,
};

function getProductCoverStyle(merchantSlug: DemoEcommerceMerchantSlug, productId: string): string {
  const palettes: Record<DemoEcommerceMerchantSlug, string[]> = {
    libreria: [
      "from-emerald-500/30 via-cyan-500/20 to-slate-900",
      "from-indigo-500/30 via-sky-500/20 to-slate-900",
      "from-teal-500/30 via-emerald-500/20 to-slate-900",
    ],
    floreria: [
      "from-rose-500/30 via-pink-500/20 to-slate-900",
      "from-orange-400/30 via-rose-500/20 to-slate-900",
      "from-fuchsia-500/30 via-rose-500/20 to-slate-900",
    ],
    marketplace: [
      "from-amber-500/30 via-orange-500/20 to-slate-900",
      "from-cyan-500/30 via-blue-500/20 to-slate-900",
      "from-lime-500/30 via-emerald-500/20 to-slate-900",
    ],
  };

  const selectedPalette = palettes[merchantSlug];
  const hash = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(hash) % selectedPalette.length;
  return selectedPalette[index];
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return apiKey;
  return `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`;
}

function merchantAccentClasses(tone: DemoEcommerceMerchant["accentTone"]): string {
  if (tone === "rose") return "border-rose-400/40 bg-rose-500/20";
  if (tone === "amber") return "border-amber-400/40 bg-amber-500/20";
  return "border-emerald-400/40 bg-emerald-500/20";
}

export default function DemoEcommerceShopSimulator() {
  const [selectedMerchantSlug, setSelectedMerchantSlug] = useState<DemoEcommerceMerchantSlug>("libreria");
  const [cartState, setCartState] = useState<DemoEcommerceCartState>(() => getEmptyDemoEcommerceCartState());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const pageSize = 9;

  useEffect(() => {
    setCartState(loadDemoEcommerceCart());

    if (typeof window === "undefined") return;

    const merchantParam = new URLSearchParams(window.location.search).get("merchant");
    if (isDemoEcommerceMerchantSlug(merchantParam)) {
      setSelectedMerchantSlug(merchantParam);
    }
  }, []);

  const selectedMerchant = useMemo(
    () => DEMO_ECOMMERCE_MERCHANTS[selectedMerchantSlug],
    [selectedMerchantSlug]
  );

  const merchantCart = useMemo(
    () => getDemoEcommerceMerchantCart(cartState, selectedMerchantSlug),
    [cartState, selectedMerchantSlug]
  );

  const totalItems = useMemo(() => countDemoEcommerceItems(merchantCart), [merchantCart]);

  const cartLines = useMemo<CartLineWithProduct[]>(() => {
    return selectedMerchant.catalog
      .filter((product) => (merchantCart[product.id] ?? 0) > 0)
      .map((product) => ({
        ...product,
        qty: merchantCart[product.id] ?? 0,
      }));
  }, [merchantCart, selectedMerchant.catalog]);

  const checkoutLines = useMemo<DemoEcommerceCartLine[]>(
    () =>
      cartLines.map((line) => ({
        id: line.id,
        name: line.name,
        price: line.price,
        qty: line.qty,
      })),
    [cartLines]
  );

  const subtotal = useMemo(() => calcDemoEcommerceSubtotal(checkoutLines), [checkoutLines]);

  const categories = useMemo(() => {
    const unique = new Set(selectedMerchant.catalog.map((item) => item.category));
    return ["Todos", ...Array.from(unique)];
  }, [selectedMerchant.catalog]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return selectedMerchant.catalog.filter((product) => {
      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!normalizedQuery) return true;

      const searchable = `${product.name} ${product.category}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [searchQuery, selectedCategory, selectedMerchant.catalog]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [currentPage, filteredProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedMerchantSlug]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateMerchantCart = useCallback(
    (updater: (current: Record<string, number>) => Record<string, number>) => {
      setCartState((prev) => {
        const currentMerchantCart = getDemoEcommerceMerchantCart(prev, selectedMerchantSlug);
        const nextMerchantCart = updater({ ...currentMerchantCart });
        const nextState: DemoEcommerceCartState = {
          ...prev,
          [selectedMerchantSlug]: nextMerchantCart,
        };

        saveDemoEcommerceCart(nextState);
        return nextState;
      });
    },
    [selectedMerchantSlug]
  );

  const addToCart = useCallback(
    (product: DemoEcommerceProduct) => {
      updateMerchantCart((current) => ({
        ...current,
        [product.id]: (current[product.id] ?? 0) + 1,
      }));
    },
    [updateMerchantCart]
  );

  const updateLineQuantity = useCallback(
    (productId: string, nextQty: number) => {
      updateMerchantCart((current) => {
        if (nextQty <= 0) {
          const { [productId]: _removed, ...rest } = current;
          return rest;
        }

        return {
          ...current,
          [productId]: nextQty,
        };
      });
    },
    [updateMerchantCart]
  );

  const clearMerchantCart = useCallback(() => {
    updateMerchantCart(() => ({}));
  }, [updateMerchantCart]);

  const selectMerchant = (merchantSlug: DemoEcommerceMerchantSlug) => {
    setSelectedMerchantSlug(merchantSlug);
    setCheckoutError(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("merchant", merchantSlug);
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  };

  const handleCheckout = () => {
    setCheckoutError(null);

    try {
      proceedToDemoEcommerceCheckout(
        selectedMerchant,
        checkoutLines,
        `/demo-ecommerce?merchant=${selectedMerchant.slug}`
      );
    } catch (error: unknown) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo abrir el checkout");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute top-1/3 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-14 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-[110px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <header className="glass-card mb-6 rounded-3xl p-6 md:p-8 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Prototipo Ecommerce</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Demo Multi Comercio FraudAI
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                Simulación de tiendas online con diferentes catálogos y estilos, integradas con el checkout de FraudAI para mostrar su análisis antifraude en acción.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Comercio activo</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{selectedMerchant.name}</p>
              <p className="text-xs text-muted-foreground">
                API key: <span className="text-foreground">{maskApiKey(selectedMerchant.apiKey)}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {DEMO_ECOMMERCE_MERCHANT_ORDER.map((slug) => {
              const merchant = DEMO_ECOMMERCE_MERCHANTS[slug];
              const Icon = MERCHANT_ICONS[merchant.slug];
              const isActive = selectedMerchantSlug === slug;

              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => selectMerchant(slug)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? cn("text-foreground", merchantAccentClasses(merchant.accentTone))
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  )}
                >
                  <Icon size={14} />
                  <span>{merchant.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar producto o categoria"
                className="glass-input h-11 w-full rounded-xl pl-10 pr-4 text-sm placeholder:text-muted-foreground/80"
              />
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                      isActive
                        ? "border-primary/55 bg-primary/20 text-foreground"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>{selectedMerchant.tagline}</p>
            <p>{selectedMerchant.hero}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <p>
                Mostrando {filteredProducts.length} de {selectedMerchant.catalog.length} productos
              </p>
              <p>
                Pagina {Math.min(currentPage, totalPages)} de {totalPages}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className="glass-card rounded-2xl p-5 animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 0.04, 0.32)}s` }}
                >
                  <div
                    className={cn(
                      "mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br",
                      getProductCoverStyle(selectedMerchant.slug, product.id)
                    )}
                  >
                    <span className="text-6xl drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]">{product.emoji}</span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {product.category}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">{product.name}</h2> 
                    {product.author && (
                      <p className="mt-1 text-sm text-muted-foreground">
                       <span className="text-foreground">{product.author}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-foreground">
                      {formatDemoEcommercePrice(product.price)}
                    </p>
                    <Button
                      onClick={() => addToCart(product)}
                      className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus size={14} /> Agregar
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="glass-card mt-4 rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay productos para ese filtro en {selectedMerchant.name}.
                </p>
              </div>
            )}

            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "h-10 min-w-10 rounded-xl border px-3 text-sm font-medium transition-all",
                          isActive
                            ? "border-primary/60 bg-primary/20 text-foreground"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          <aside className="glass-checkout-summary h-fit rounded-3xl p-6 lg:sticky lg:top-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{selectedMerchant.cartLabel}</h2>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                <ShoppingCart size={14} /> {totalItems} items
              </div>
            </div>

            {cartLines.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                <Store size={18} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Agrega productos para continuar al checkout.</p>
              </div>
            )}

            {cartLines.length > 0 && (
              <div className="space-y-3">
                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                  {cartLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{line.name}</p>
                          <p className="text-xs text-muted-foreground">{line.category}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDemoEcommercePrice(line.price)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.qty - 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                            aria-label="Quitar unidad"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="min-w-6 text-center text-sm font-medium text-foreground">
                            {line.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.qty + 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                            aria-label="Agregar unidad"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                          {formatDemoEcommercePrice(line.qty * line.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">{formatDemoEcommercePrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Envio</span>
                    <span className="text-emerald-400">Gratis</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-base font-bold text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">{formatDemoEcommercePrice(subtotal)}</span>
                  </div>
                </div>

                {checkoutError && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {checkoutError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleCheckout}
                    className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShoppingCart size={14} /> Proceder al pago
                  </Button>

                  <Button
                    onClick={clearMerchantCart}
                    variant="outline"
                    className="h-10 rounded-xl border-white/15 bg-transparent hover:bg-white/5"
                  >
                    <Trash2 size={14} /> Vaciar carrito
                  </Button>
                </div>
              </div>
            )}

            {/* <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Checkout FraudAI</p>
              <p className="mt-1">
                Al proceder al checkout, se abrirá la interfaz de pago de FraudAI en una nueva pestaña, donde podrás ver el análisis antifraude en acción con los productos que has agregado al carrito.
              </p>
            </div> */}
          </aside>
        </section>
      </div>

      <FraudAiLoginFloatingButton />
    </main>
  );
}
