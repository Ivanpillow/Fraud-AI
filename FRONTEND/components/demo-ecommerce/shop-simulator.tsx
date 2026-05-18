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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FraudAiLoginFloatingButton from "@/components/demo-libreria/fraudai-login-floating-button";
import { cn } from "@/lib/utils";
import { getProductImage } from "../../lib/demo-product-images";
import {
  DEMO_ECOMMERCE_MERCHANT_ORDER,
  DEMO_ECOMMERCE_MERCHANTS,
  formatDemoEcommercePrice,
  isDemoEcommerceMerchantSlug,
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

  const handleFraudAiLogin = useCallback(() => {
    clearMerchantCart();
  }, [clearMerchantCart]);

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
    <main className="relative min-h-screen overflow-hidden px-4 py-12 md:px-6 md:py-16">
      {/* Gradient backgrounds específicos por comercio */}
      <div className="pointer-events-none fixed inset-0 -z-10 transition-all duration-700">
        {selectedMerchantSlug === "floreria" && (
          <>
            <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-rose-500/15 blur-[140px]" />
            <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-pink-500/15 blur-[150px]" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-rose-400/10 blur-[130px]" />
          </>
        )}
        {selectedMerchantSlug === "libreria" && (
          <>
            <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/15 blur-[140px]" />
            <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-green-500/15 blur-[150px]" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[130px]" />
          </>
        )}
        {selectedMerchantSlug === "marketplace" && (
          <>
            <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-amber-500/15 blur-[140px]" />
            <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-orange-500/15 blur-[150px]" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[130px]" />
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl p-8 md:p-10 animate-fade-in"
                 style={{
                   background: selectedMerchantSlug === "floreria" 
                     ? "linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)"
                     : selectedMerchantSlug === "libreria"
                     ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)"
                     : "linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(234, 179, 8, 0.08) 100%)"
                 }}>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5 blur-[80px]" />
          </div>

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                {selectedMerchant.name}
              </h1>
              <p className="text-lg text-muted-foreground/90 mb-4">
                {selectedMerchant.tagline}
              </p>
              {selectedMerchant.hero && (
                <p className="text-sm text-muted-foreground italic">
                  "{selectedMerchant.hero}"
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/80">Tienda en Línea</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{selectedMerchant.name}</p>
              {/* <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 border border-emerald-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-xs text-emerald-300">Online</p>
              </div> */}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Cambiar tienda</p>
            <div className="flex flex-wrap gap-3">
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
                      "group relative overflow-hidden rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300",
                      isActive
                        ? cn("border-white/30 bg-white/15 text-foreground shadow-lg scale-105", 
                            merchant.accentTone === "rose" ? "shadow-rose-500/20" :
                            merchant.accentTone === "emerald" ? "shadow-emerald-500/20" :
                            "shadow-amber-500/20")
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground hover:border-white/20"
                    )}
                  >
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span>{merchant.name}</span>
                      {isActive && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-current animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div className="relative group">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Buscar en ${selectedMerchant.name}...`}
                className="w-full h-12 rounded-xl pl-12 pr-4 text-base bg-white/8 border border-white/15 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/12 transition-all"
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
                      "rounded-lg border px-4 py-2 text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "border-primary/60 bg-primary/25 text-foreground shadow-lg shadow-primary/20"
                        : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/25 hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">{selectedMerchant.catalog.length} productos disponibles</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="mb-6 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{filteredProducts.length}</span> de <span className="font-semibold text-foreground">{selectedMerchant.catalog.length}</span> productos
              </p>
              {totalPages > 1 && (
                <p className="text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{Math.min(currentPage, totalPages)}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className="group relative rounded-2xl border border-white/15 bg-white/5 overflow-hidden hover:border-white/40 transition-all duration-300 animate-fade-in hover:-translate-y-1 hover:shadow-xl"
                  style={{ 
                    animationDelay: `${Math.min(idx * 0.05, 0.35)}s`,
                    boxShadow: `0 0 30px -10px ${
                      selectedMerchantSlug === "floreria" ? "rgba(244, 63, 94, 0.2)" :
                      selectedMerchantSlug === "libreria" ? "rgba(34, 197, 94, 0.2)" :
                      "rgba(217, 119, 6, 0.2)"
                    }`
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/10 group-hover:animate-pulse transition-all duration-300" />
                  
                  <div
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-t-2xl border-b border-white/10 bg-gradient-to-br",
                      selectedMerchantSlug === "floreria" ? "from-rose-500/20 via-pink-500/10 to-slate-900" :
                      selectedMerchantSlug === "libreria" ? "from-emerald-500/20 via-green-500/10 to-slate-900" :
                      "from-amber-500/20 via-orange-500/10 to-slate-900"
                    )}
                  >
                    <img
                      src={getProductImage(
                        product.id,
                        selectedMerchantSlug === "libreria"
                          ? "book"
                          : selectedMerchantSlug === "floreria"
                            ? "flowers"
                            : "electronics"
                      )}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                  </div>

                  <div className="p-5">
                    <div className="mb-3 inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                      {product.category}
                    </div>
                    <h2 className="text-base font-bold text-foreground leading-snug h-14 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h2> 
                    {product.author && (
                      <p className="mt-2 text-xs text-muted-foreground/80">
                        por <span className="font-medium text-muted-foreground">{product.author}</span>
                      </p>
                    )}
                  </div>

                  <div className="border-t border-white/10 px-5 py-4 flex items-center justify-between gap-3 bg-white/[0.02]">
                    <p className="text-lg font-bold text-foreground">
                      {formatDemoEcommercePrice(product.price)}
                    </p>
                    <Button
                      onClick={() => addToCart(product)}
                      className={cn(
                        "rounded-lg text-sm font-semibold h-10 gap-1.5 transition-all",
                        selectedMerchantSlug === "floreria" ? "bg-rose-600 hover:bg-rose-700 text-white" :
                        selectedMerchantSlug === "libreria" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                        "bg-amber-600 hover:bg-amber-700 text-white"
                      )}
                    >
                      <Plus size={16} /> Agregar
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/15 bg-white/[0.03] p-12 text-center">
                <div className={cn(
                  "mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4",
                  selectedMerchantSlug === "floreria" ? "bg-rose-500/20" :
                  selectedMerchantSlug === "libreria" ? "bg-emerald-500/20" :
                  "bg-amber-500/20"
                )}>
                  <Search className={cn(
                    "h-8 w-8",
                    selectedMerchantSlug === "floreria" ? "text-rose-300" :
                    selectedMerchantSlug === "libreria" ? "text-emerald-300" :
                    "text-amber-300"
                  )} />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">No encontramos productos</p>
                <p className="text-sm text-muted-foreground">
                  Intenta con otros filtros o categorías en {selectedMerchant.name}
                </p>
              </div>
            )}

            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "h-10 px-4 rounded-lg border font-semibold text-sm transition-all",
                    currentPage === 1
                      ? "border-white/10 bg-white/5 text-muted-foreground/50 cursor-not-allowed"
                      : "border-white/20 bg-white/10 text-foreground hover:bg-white/20 hover:border-white/30"
                  )}
                >
                  ← Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                    let page: number;
                    if (totalPages <= 7) {
                      page = index + 1;
                    } else if (currentPage <= 4) {
                      page = index + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + index;
                    } else {
                      page = currentPage - 3 + index;
                    }
                    
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "h-10 min-w-10 rounded-lg border font-semibold text-sm transition-all",
                          isActive
                            ? "border-primary/60 bg-primary/25 text-foreground shadow-lg shadow-primary/20"
                            : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/30 hover:text-foreground"
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
                  className={cn(
                    "h-10 px-4 rounded-lg border font-semibold text-sm transition-all",
                    currentPage === totalPages
                      ? "border-white/10 bg-white/5 text-muted-foreground/50 cursor-not-allowed"
                      : "border-white/20 bg-white/10 text-foreground hover:bg-white/20 hover:border-white/30"
                  )}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm overflow-hidden lg:sticky lg:top-6 h-fit">
            <div className={cn(
              "px-6 py-6 border-b border-white/15",
              selectedMerchantSlug === "floreria" ? "bg-gradient-to-r from-rose-500/10 to-pink-500/10" :
              selectedMerchantSlug === "libreria" ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10" :
              "bg-gradient-to-r from-amber-500/10 to-orange-500/10"
            )}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  {/* <p className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1">Tu carrito</p> */}
                  <h2 className="text-2xl font-bold text-foreground">{selectedMerchant.cartLabel}</h2>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white",
                  selectedMerchantSlug === "floreria" ? "bg-rose-600" :
                  selectedMerchantSlug === "libreria" ? "bg-emerald-600" :
                  "bg-amber-600"
                )}>
                  <ShoppingCart size={16} />
                  <span>{totalItems}</span>
                </div>
              </div>
            </div>

            {cartLines.length === 0 && (
              <div className="p-8 text-center">
                <div className={cn(
                  "mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-3",
                  selectedMerchantSlug === "floreria" ? "bg-rose-500/20" :
                  selectedMerchantSlug === "libreria" ? "bg-emerald-500/20" :
                  "bg-amber-500/20"
                )}>
                  <ShoppingCart size={24} className={cn(
                    selectedMerchantSlug === "floreria" ? "text-rose-300" :
                    selectedMerchantSlug === "libreria" ? "text-emerald-300" :
                    "text-amber-300"
                  )} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Tu carrito está vacío</p>
                <p className="text-xs text-muted-foreground/80">Agrega productos para comenzar tu compra</p>
              </div>
            )}

            {cartLines.length > 0 && (
              <div className="flex flex-col h-full">
                <div className="max-h-[300px] overflow-auto p-4 space-y-3">
                  {cartLines.map((line) => (
                    <div
                      key={line.id}
                      className={cn(
                        "rounded-xl border p-3 group transition-all hover:border-white/25",
                        selectedMerchantSlug === "floreria" ? "border-rose-400/20 bg-rose-500/5 hover:bg-rose-500/10" :
                        selectedMerchantSlug === "libreria" ? "border-emerald-400/20 bg-emerald-500/5 hover:bg-emerald-500/10" :
                        "border-amber-400/20 bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{line.name}</p>
                          <p className="text-xs text-muted-foreground/80">{line.category}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground whitespace-nowrap">
                          {formatDemoEcommercePrice(line.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.qty - 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground hover:border-white/25"
                            aria-label="Quitar unidad"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold text-foreground">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.qty + 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground hover:border-white/25"
                            aria-label="Agregar unidad"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-foreground">
                          {formatDemoEcommercePrice(line.qty * line.price)}
                        </p>

                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line.id, 0)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-400/20 bg-red-500/10 text-red-300/80 transition hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/40"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "border-t border-white/15 p-4 space-y-4",
                  selectedMerchantSlug === "floreria" ? "bg-rose-500/5" :
                  selectedMerchantSlug === "libreria" ? "bg-emerald-500/5" :
                  "bg-amber-500/5"
                )}>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold text-foreground">{formatDemoEcommercePrice(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Envío</span>
                      <span className="font-semibold text-emerald-400">Gratis</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/15 pt-2.5">
                      <span className="font-bold text-foreground">Total</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        selectedMerchantSlug === "floreria" ? "text-rose-300" :
                        selectedMerchantSlug === "libreria" ? "text-emerald-300" :
                        "text-amber-300"
                      )}>{formatDemoEcommercePrice(subtotal)}</span>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-medium">
                      ⚠️ {checkoutError}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    <Button
                      onClick={handleCheckout}
                      className={cn(
                        "w-full h-11 rounded-lg font-semibold text-white gap-2 transition-all hover:shadow-lg",
                        selectedMerchantSlug === "floreria" ? "bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/30" :
                        selectedMerchantSlug === "libreria" ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30" :
                        "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/30"
                      )}
                    >
                      <ShoppingCart size={16} /> Proceder al pago
                    </Button>

                    <Button
                      onClick={clearMerchantCart}
                      variant="outline"
                      className="w-full h-10 rounded-lg border-white/20 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-semibold gap-2 transition-all"
                    >
                      <Trash2 size={16} /> Vaciar carrito
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      <FraudAiLoginFloatingButton onLogin={handleFraudAiLogin} />
    </main>
  );
}
