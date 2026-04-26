"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import FraudAiLoginFloatingButton from "@/components/demo-libreria/fraudai-login-floating-button";
import {
  countDemoLibreriaItems,
  loadDemoLibreriaCart,
  saveDemoLibreriaCart,
  type DemoLibreriaCartState,
} from "@/lib/demo-libreria-cart";
import {
  DEMO_LIBRERIA_BOOKS,
  findDemoBookById,
  formatMXN,
} from "@/lib/demo-libreria-data";

function getBookCoverStyle(bookId: string) {
  const styles = [
    "from-emerald-500/30 via-cyan-500/20 to-slate-900",
    "from-amber-500/30 via-orange-500/20 to-slate-900",
    "from-indigo-500/30 via-violet-500/20 to-slate-900",
    "from-rose-500/30 via-pink-500/20 to-slate-900",
    "from-teal-500/30 via-sky-500/20 to-slate-900",
  ];

  const index = Math.abs(bookId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % styles.length;
  return styles[index];
}

export default function DemoLibreriaBookDetailPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params?.bookId ?? "";

  const [cart, setCart] = useState<DemoLibreriaCartState>({});

  useEffect(() => {
    setCart(loadDemoLibreriaCart());
  }, []);

  const totalItems = useMemo(() => countDemoLibreriaItems(cart), [cart]);
  const book = useMemo(() => findDemoBookById(bookId), [bookId]);

  const relatedBooks = useMemo(() => {
    if (!book) return [];

    return DEMO_LIBRERIA_BOOKS.filter(
      (candidate) =>
        candidate.id !== book.id &&
        (candidate.author === book.author || candidate.genre === book.genre)
    ).slice(0, 4);
  }, [book]);

  const addToCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      saveDemoLibreriaCart(next);
      return next;
    });
  };

  if (!book) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="glass-card rounded-3xl p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Libro no encontrado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este titulo no esta disponible en el catalogo actual.
            </p>
            <Link href="/demo-libreria" className="mt-5 inline-flex">
              <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                Volver al catalogo
              </Button>
            </Link>
          </div>
        </div>

        <FraudAiLoginFloatingButton />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl animate-fade-in">
        <header className="glass-card mb-6 rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/demo-libreria" className="inline-flex">
              <Button
                variant="outline"
                className="rounded-xl border-primary/35 bg-primary/20 text-foreground hover:bg-primary/30"
              >
                <ArrowLeft size={16} /> Regresar al catalogo
              </Button>
            </Link>
            <Link href="/demo-libreria/carrito" className="inline-flex">
              <Button className="rounded-xl border border-emerald-300/40 bg-emerald-500/25 text-foreground hover:bg-emerald-500/35">
                <ShoppingCart size={16} /> Carrito ({totalItems})
              </Button>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <article className="glass-card rounded-3xl p-6 md:p-8">
            <div className={`mb-6 flex aspect-[16/9] items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br ${getBookCoverStyle(book.id)} overflow-hidden`}>
              <div className="flex h-28 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-semibold uppercase tracking-[0.3em] text-white/85">
                Libro
              </div>
            </div>

            <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {book.genre}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{book.title}</h1>
            <p className="mt-2 text-base text-muted-foreground">{book.author}</p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Precio</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatMXN(book.price)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Disponibilidad</p>
                <p className="mt-1 text-lg font-semibold text-emerald-400">En stock</p>
              </div>
            </div>

            <p className="mt-8 text-sm leading-7 text-muted-foreground">
              Edición destacada de {book.author}, este libro es un imprescindible para los amantes de {book.genre}. Con una narrativa cautivadora y personajes memorables, es una adición perfecta para tu colección.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() => addToCart(book.id)}
                className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={15} /> Agregar al carrito
              </Button>
              <Link href="/demo-libreria/carrito" className="inline-flex">
                <Button variant="outline" className="h-11 rounded-xl border-white/15 bg-transparent hover:bg-white/5">
                  Ir al carrito
                </Button>
              </Link>
            </div>
          </article>

          <aside className="glass-checkout-summary h-fit rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-foreground">Tambien podria gustarte</h2>

            <div className="mt-4 space-y-3">
              {relatedBooks.map((related) => (
                <div key={related.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/demo-libreria/libro/${related.id}`}>
                        <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                          {related.title}
                        </p>
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{related.author}</p>
                    </div>
                    <BookOpen size={14} className="text-primary mt-0.5" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{formatMXN(related.price)}</p>
                    <button
                      type="button"
                      onClick={() => addToCart(related.id)}
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>

      <FraudAiLoginFloatingButton />
    </main>
  );
}
