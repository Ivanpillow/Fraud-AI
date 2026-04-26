"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FraudAiLoginFloatingButton from "@/components/demo-libreria/fraudai-login-floating-button";
import {
  clearDemoLibreriaCart,
  countDemoLibreriaItems,
  loadDemoLibreriaCart,
  saveDemoLibreriaCart,
  type DemoLibreriaCartState,
} from "@/lib/demo-libreria-cart";
import { DEMO_LIBRERIA_BOOKS, formatMXN } from "@/lib/demo-libreria-data";
import {
  saveDemoLibreriaCheckoutContext,
  type DemoLibreriaCheckoutContext,
} from "@/lib/demo-libreria-checkout-context";

export default function DemoLibreriaCarritoPage() {
  const [cart, setCart] = useState<DemoLibreriaCartState>({});

  useEffect(() => {
    setCart(loadDemoLibreriaCart());
  }, []);

  const cartItems = useMemo(
    () =>
      DEMO_LIBRERIA_BOOKS.filter((book) => (cart[book.id] ?? 0) > 0).map((book) => ({
        ...book,
        qty: cart[book.id],
      })),
    [cart]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartItems]
  );

  const totalItems = useMemo(() => countDemoLibreriaItems(cart), [cart]);

  const updateQuantity = (bookId: string, nextQty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[bookId];
      } else {
        next[bookId] = nextQty;
      }
      saveDemoLibreriaCart(next);
      return next;
    });
  };

  const clearCart = () => {
    clearDemoLibreriaCart();
    setCart({});
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;

    const checkoutContext: DemoLibreriaCheckoutContext = {
      version: 1,
      merchant: {
        slug: "libreria",
        name: "Libreria BookSwap",
        apiKey: "libreria_key",
      },
      cart: {
        currency: "MXN",
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.title,
          price: item.price,
          qty: item.qty,
        })),
        subtotal,
        shipping: 0,
        tax: 0,
        total: subtotal,
      },
      returnUrl: "/demo-libreria/carrito",
      createdAt: new Date().toISOString(),
    };

    saveDemoLibreriaCheckoutContext(checkoutContext);
    window.location.href = "/demo-libreria/checkout";
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl animate-fade-in">
        <header className="glass-card mb-6 rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Carrito</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Tu selección de libros
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Carrito ideal para mostrar un flujo real de ecommerce con gestion de carrito y checkout antifraude con FraudAI.
              </p>
            </div>
            <Link href="/demo-libreria" className="inline-flex">
              <Button
                variant="outline"
                className="rounded-xl border-primary/35 bg-primary/20 text-foreground hover:bg-primary/30"
              >
                <ArrowLeft size={16} /> Regresar al catalogo
              </Button>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glass-card rounded-3xl p-5 md:p-6">
            {cartItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                <p className="text-base text-muted-foreground">Tu carrito esta vacio.</p>
                <Link href="/demo-libreria" className="mt-4 inline-flex">
                  <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    Explorar catalogo
                  </Button>
                </Link>
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link href={`/demo-libreria/libro/${item.id}`}>
                          <p className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                            {item.title}
                          </p>
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.genre}</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{formatMXN(item.price)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                          aria-label="Quitar unidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium text-foreground">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                          aria-label="Agregar unidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatMXN(item.qty * item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="glass-checkout-summary sticky top-6 h-fit rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Resumen</h2>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                <ShoppingCart size={14} /> {totalItems} items
              </div>
            </div>

            <div className="space-y-3 border-b border-white/10 pb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatMXN(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Envio</span>
                <span className="text-emerald-400">Gratis</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-base text-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">{formatMXN(subtotal)}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <Button
                onClick={proceedToCheckout}
                disabled={cartItems.length === 0}
                className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Proceder al pago
              </Button>
              <Button
                onClick={clearCart}
                variant="outline"
                disabled={cartItems.length === 0}
                className="h-10 rounded-xl border-white/15 bg-transparent hover:bg-white/5"
              >
                <Trash2 size={14} /> Vaciar carrito
              </Button>
            </div>
          </aside>
        </section>
      </div>

      <FraudAiLoginFloatingButton />
    </main>
  );
}
