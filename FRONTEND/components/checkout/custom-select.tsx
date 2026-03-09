"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
  disabled = false,
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(256);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Lógica para decidir si el dropdown se abre hacia arriba o hacia abajo
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updateDropdownPosition = () => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const shouldOpenUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUpward);

      const availableSpace = shouldOpenUpward ? spaceAbove - 12 : spaceBelow - 12;
      const safeMaxHeight = Math.max(120, Math.min(320, availableSpace));
      setDropdownMaxHeight(safeMaxHeight);
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    // Contenedor principal del select personalizado
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "checkout-input flex items-center justify-between w-full",
          "bg-glass border-1.5 border-glass rounded-lg",
          "text-right transition-all duration-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}  
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "transition-transform duration-300 text-white/60",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && !disabled && (
        // Es la lista de opciones desplegable
        <div
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-50",
            openUpward ? "bottom-full mb-2" : "top-full mt-2",
            "checkout-dropdown-panel rounded-lg",
            "shadow-lg",
            "overflow-y-auto",
            "py-2"
          )}
          style={{ maxHeight: `${dropdownMaxHeight}px` }}
        >
          {options.map((option, index) => (
            // Cada opción dentro de la lista desplegable
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              className={cn(
                // Estilos para cada opción, incluyendo estados activo y resaltado
                "w-full px-4 py-3 text-left text-sm transition-all duration-200",
                "hover:bg-white/10 focus:outline-none",
                // Estilo para la opción seleccionada
                value === option.value
                  ? "bg-primary/20 text-primary-foreground border-l-2 border-primary pl-3"
                  : "text-foreground/100",
                // Estilo para la opción resaltada al pasar el mouse
                highlightedIndex === index && value !== option.value
                  ? "bg-white/05"
                  : ""
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
