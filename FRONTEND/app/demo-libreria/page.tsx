"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import FraudAiLoginFloatingButton from "@/components/demo-libreria/fraudai-login-floating-button";
import { countDemoLibreriaItems, loadDemoLibreriaCart, saveDemoLibreriaCart } from "@/lib/demo-libreria-cart";
import { DEMO_LIBRERIA_BOOKS, formatMXN, getDemoLibreriaGenres } from "@/lib/demo-libreria-data";

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

export default function DemoLibreriaPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setCart(loadDemoLibreriaCart());
  }, []);

  const totalItems = useMemo(() => countDemoLibreriaItems(cart), [cart]);

  const genres = useMemo(() => ["Todos", ...getDemoLibreriaGenres()], []);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return DEMO_LIBRERIA_BOOKS.filter((book) => {
      const matchesGenre = selectedGenre === "Todos" || book.genre === selectedGenre;
      if (!matchesGenre) return false;

      if (!normalizedQuery) return true;

      const searchableText = `${book.title} ${book.author} ${book.genre}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, selectedGenre]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBooks.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredBooks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const addToCart = (bookId: string) => {
    setCart((prev) => {
      const next = { ...prev, [bookId]: (prev[bookId] ?? 0) + 1 };
      saveDemoLibreriaCart(next);
      return next;
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute top-1/2 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <header className="glass-card mb-6 rounded-3xl p-6 md:p-8 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Prototipo Ecommerce</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Librería BookSwap
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Prototipo de tienda en linea para demostrar la integracion de FraudAI en un proceso de compra real. 
              </p>
            </div>
            <Link href="/demo-libreria/carrito" className="inline-flex">
              <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                <ShoppingCart size={16} /> Ver carrito ({totalItems})
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative max-w-xl">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, autor o género"
                className="glass-input h-11 w-full rounded-xl pl-10 pr-4 text-sm placeholder:text-muted-foreground/80"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "border-primary/60 bg-primary/20 text-foreground"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                    ].join(" ")}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                Mostrando {filteredBooks.length} de {DEMO_LIBRERIA_BOOKS.length} libros
              </p>
              <p>
                Página {Math.min(currentPage, totalPages)} de {totalPages}
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedBooks.map((book, idx) => (
            <article
              key={book.id}
              className="glass-card rounded-2xl p-5 animate-fade-in"
              style={{ animationDelay: `${Math.min(idx * 0.04, 0.32)}s` }}
            >
              <div className={`mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${getBookCoverStyle(book.id)} overflow-hidden`}>
                <div className="flex h-16 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85">
                  Libro
                </div>
              </div>

              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {book.genre}
                  </div>
                  <Link href={`/demo-libreria/libro/${book.id}`}>
                    <h2 className="text-lg font-semibold text-foreground leading-tight hover:text-primary transition-colors">
                      {book.title}
                    </h2>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <BookOpen size={16} className="text-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-bold text-foreground">{formatMXN(book.price)}</p>
                <div className="flex gap-2">
                  <Link href={`/demo-libreria/libro/${book.id}`} className="inline-flex">
                    <Button variant="outline" className="rounded-xl border-white/15 bg-transparent hover:bg-white/5">
                      Ver detalle
                    </Button>
                  </Link>
                  <Button
                    onClick={() => addToCart(book.id)}
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus size={14} /> Agregar
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {filteredBooks.length === 0 && (
          <div className="glass-card mt-4 rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No encontramos libros con ese criterio. Prueba con otro autor o genero.
            </p>
          </div>
        )}

        {filteredBooks.length > 0 && totalPages > 1 && (
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
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={[
                      "h-10 min-w-10 rounded-xl border px-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary/60 bg-primary/20 text-foreground"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                    ].join(" ")}
                  >
                    {pageNumber}
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

      <FraudAiLoginFloatingButton />
    </main>
  );
}
