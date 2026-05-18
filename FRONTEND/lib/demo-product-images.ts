export const DEMO_PRODUCT_IMAGES: Record<string, string> = {
  // Libros - Open Library Covers por ISBN
  "book-got-1": "https://covers.openlibrary.org/b/isbn/9780553593716-L.jpg",
  "book-got-2": "https://covers.openlibrary.org/b/isbn/9780553579901-L.jpg",
  "book-got-3": "https://covers.openlibrary.org/b/isbn/9780553573428-L.jpg",
  "book-got-4": "https://covers.openlibrary.org/b/isbn/9780553582024-L.jpg",
  "book-got-5": "https://covers.openlibrary.org/b/isbn/9780553582017-L.jpg",
  "book-hp-1": "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
  "book-hp-2": "https://covers.openlibrary.org/b/isbn/9780439064873-L.jpg",
  "book-hp-3": "https://covers.openlibrary.org/b/isbn/9780439136365-L.jpg",
  "book-hp-4": "https://covers.openlibrary.org/b/isbn/9780439139595-L.jpg",
  "book-hp-5": "https://covers.openlibrary.org/b/isbn/9780439358064-L.jpg",
  "book-hp-6": "https://covers.openlibrary.org/b/isbn/9780439785969-L.jpg",
  "book-hp-7": "https://covers.openlibrary.org/b/isbn/9780545010221-L.jpg",
  "book-sk-1": "https://covers.openlibrary.org/b/isbn/9781501142970-L.jpg",
  "book-sk-2": "https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg",
  "book-sk-3": "https://covers.openlibrary.org/b/isbn/9781501143106-L.jpg",
  "book-sk-4": "https://covers.openlibrary.org/b/isbn/9781982112394-L.jpg",
  "book-sk-5": "https://covers.openlibrary.org/b/isbn/9781476727653-L.jpg",
  "book-sk-6": "https://covers.openlibrary.org/b/isbn/9781451627299-L.jpg",
  "book-sk-7": "https://covers.openlibrary.org/b/isbn/9781439149522-L.jpg",
  "book-lotr-1": "https://covers.openlibrary.org/b/isbn/9780618346257-L.jpg",
  "book-lotr-2": "https://covers.openlibrary.org/b/isbn/9780618346264-L.jpg",
  "book-lotr-3": "https://covers.openlibrary.org/b/isbn/9780618346271-L.jpg",
  "book-scifi-1": "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
  "book-scifi-2": "https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg",
  "book-classic-1": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
  "book-classic-2": "https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg",
  "book-thriller-1": "https://covers.openlibrary.org/b/isbn/9780307474278-L.jpg",

  // Floreria - Unsplash CDN (IDs verificados) + loremflickr fallback
  "f1": "https://images.unsplash.com/photo-1629386288242-edd3f7b8faf4?auto=format&fit=crop&w=600&h=600&q=80",
  "f2": "https://images.unsplash.com/photo-1680280567965-f4d9be6b46e2?auto=format&fit=crop&w=600&h=600&q=80",
  "f3": "https://loremflickr.com/600/600/sunflowers/all?lock=303",
  "f4": "https://loremflickr.com/600/600/orchid,white/all?lock=404",
  "f5": "https://images.unsplash.com/photo-1774431193639-e0bebeb5cfa0?auto=format&fit=crop&w=600&h=600&q=80",
  "f6": "https://loremflickr.com/600/600/lilies,white,flowers/all?lock=606",
  "f7": "https://images.unsplash.com/photo-1560256608-43f0b6f7588e?auto=format&fit=crop&w=600&h=600&q=80",
  "f8": "https://images.unsplash.com/photo-1772211506039-8bd23fcc060a?auto=format&fit=crop&w=600&h=600&q=80",

  // ElectroHub - Unsplash CDN (IDs verificados) + loremflickr fallback
  "m1": "https://loremflickr.com/600/600/headphones,wireless/all?lock=111",
  "m2": "https://images.unsplash.com/photo-1542810330-e5bd86abb23e?auto=format&fit=crop&w=600&h=600&q=80",
  "m3": "https://images.unsplash.com/photo-1611010344444-5f9e4d86a6e1?auto=format&fit=crop&w=600&h=600&q=80",
  "m4": "https://images.unsplash.com/photo-1619020986176-50be596d0c02?auto=format&fit=crop&w=600&h=600&q=80",
  "m5": "https://loremflickr.com/600/600/mechanical,keyboard,rgb/all?lock=555",
  "m6": "https://images.unsplash.com/photo-1623177579111-ccdec0898ed1?auto=format&fit=crop&w=600&h=600&q=80",
};

export function getProductImage(productId: string, fallbackKeyword = "product"): string {
  return (
    DEMO_PRODUCT_IMAGES[productId] ??
    `https://loremflickr.com/400/400/${fallbackKeyword}/all?lock=${productId.length * 7}`
  );
}

export async function validateImageUrl(url: string, fallback: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(fallback);
    img.src = url;
  });
}
