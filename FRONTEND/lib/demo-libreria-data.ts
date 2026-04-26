export type DemoBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
};

export const DEMO_LIBRERIA_BOOKS: DemoBook[] = [
  {
    id: "book-got-1",
    title: "Juego de Tronos",
    author: "George R. R. Martin",
    genre: "Fantasía",
    price: 399,
  },
  {
    id: "book-got-2",
    title: "Choque de Reyes",
    author: "George R. R. Martin",
    genre: "Fantasía",
    price: 429,
  },
  {
    id: "book-got-3",
    title: "Tormenta de Espadas",
    author: "George R. R. Martin",
    genre: "Fantasía",
    price: 459,
  },
  {
    id: "book-hp-1",
    title: "Harry Potter y la Piedra Filosofal",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 349,
  },
  {
    id: "book-hp-2",
    title: "Harry Potter y la Cámara Secreta",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 359,
  },
  {
    id: "book-hp-3",
    title: "Harry Potter y el Prisionero de Azkaban",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 379,
  },
  {
    id: "book-sk-1",
    title: "It",
    author: "Stephen King",
    genre: "Terror",
    price: 439,
  },
  {
    id: "book-sk-2",
    title: "El Resplandor",
    author: "Stephen King",
    genre: "Terror",
    price: 389,
  },
  {
    id: "book-sk-3",
    title: "Misery",
    author: "Stephen King",
    genre: "Suspenso",
    price: 329,
  },
  {
    id: "book-sk-4",
    title: "Cementerio de Animales",
    author: "Stephen King",
    genre: "Terror",
    price: 359,
  },
  {
    id: "book-got-4",
    title: "Festín de Cuervos",
    author: "George R. R. Martin",
    genre: "Fantasía",
    price: 449,
  },
  {
    id: "book-got-5",
    title: "Danza de Dragones",
    author: "George R. R. Martin",
    genre: "Fantasía",
    price: 469,
  },
  {
    id: "book-hp-4",
    title: "Harry Potter y el Cáliz de Fuego",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 399,
  },
  {
    id: "book-hp-5",
    title: "Harry Potter y la Órden del Fenix",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 429,
  },
  {
    id: "book-hp-6",
    title: "Harry Potter y el Misterio del Principe",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 419,
  },
  {
    id: "book-hp-7",
    title: "Harry Potter y las Reliquias de la Muerte",
    author: "J. K. Rowling",
    genre: "Fantasía",
    price: 439,
  },
  {
    id: "book-sk-5",
    title: "Doctor Sueño",
    author: "Stephen King",
    genre: "Terror",
    price: 409,
  },
  {
    id: "book-sk-6",
    title: "22/11/63",
    author: "Stephen King",
    genre: "Suspenso",
    price: 449,
  },
  {
    id: "book-sk-7",
    title: "La Cúpula",
    author: "Stephen King",
    genre: "Suspenso",
    price: 419,
  },
  {
    id: "book-lotr-1",
    title: "La Comunidad del Anillo",
    author: "J. R. R. Tolkien",
    genre: "Fantasía",
    price: 419,
  },
  {
    id: "book-lotr-2",
    title: "Las Dos Torres",
    author: "J. R. R. Tolkien",
    genre: "Fantasía",
    price: 429,
  },
  {
    id: "book-lotr-3",
    title: "El Retorno del Rey",
    author: "J. R. R. Tolkien",
    genre: "Fantasía",
    price: 439,
  },
  {
    id: "book-scifi-1",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Ciencia Ficción",
    price: 469,
  },
  {
    id: "book-scifi-2",
    title: "Fundación",
    author: "Isaac Asimov",
    genre: "Ciencia Ficción",
    price: 349,
  },
  {
    id: "book-classic-1",
    title: "1984",
    author: "George Orwell",
    genre: "Clasico",
    price: 299,
  },
  {
    id: "book-classic-2",
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    genre: "Clasico",
    price: 319,
  },
  {
    id: "book-thriller-1",
    title: "El Código Da Vinci",
    author: "Dan Brown",
    genre: "Thriller",
    price: 339,
  },
  {
    id: "book-thriller-2",
    title: "Perdida",
    author: "Gillian Flynn",
    genre: "Thriller",
    price: 359,
  },
];

export function findDemoBookById(bookId: string): DemoBook | undefined {
  return DEMO_LIBRERIA_BOOKS.find((book) => book.id === bookId);
}

export function getDemoLibreriaGenres(): string[] {
  return Array.from(new Set(DEMO_LIBRERIA_BOOKS.map((book) => book.genre))).sort();
}

export function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}
