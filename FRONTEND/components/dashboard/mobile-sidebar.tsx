"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./sidebar";

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl glass-button text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-0 top-0 z-50 h-full animate-slide-left lg:hidden">
            <Sidebar />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-[-48px] flex h-10 w-10 items-center justify-center rounded-xl glass-button text-foreground"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
