"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "I start my mornings with FraudAI. Just 10 minutes to review all transactions and catch issues before they escalate. It's the one tool that's actually helped us reduce fraud by 80%.",
    name: "Mei Tan",
    title: "CEO of Lumira Labs",
    image: "/images/testimonial.jpg",
  },
  {
    quote:
      "The real-time fraud detection saved us from a $50,000 chargeback within our first week. The dashboard makes complex data incredibly simple to act on.",
    name: "Carlos Rivera",
    title: "CTO of PayStream",
    image: "/images/testimonial.jpg",
  },
  {
    quote:
      "We process over 10,000 transactions daily. FraudAI gives us the visibility and control we need without slowing anything down.",
    name: "Sarah Chen",
    title: "VP of Operations, FinCore",
    image: "/images/testimonial.jpg",
  },
];

export default function Testimonial() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  const prev = () =>
    setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () =>
    setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <Image
        src={current.image || "/placeholder.svg"}
        alt={`${current.name} portrait`}
        fill
        className="object-cover transition-opacity duration-500"
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
        <blockquote
          key={index}
          className="animate-fade-in text-lg md:text-xl leading-relaxed text-white/95 font-light mb-5"
        >
          {`\u201C${current.quote}\u201D`}
        </blockquote>
        <p className="text-xl font-semibold text-white">{current.name}</p>
        <p className="text-sm text-white/60 mb-6">{current.title}</p>

        <div className="flex gap-3">
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full glass-button text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full glass-button text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
