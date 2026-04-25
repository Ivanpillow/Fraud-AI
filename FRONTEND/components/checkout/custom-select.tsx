"use client";

import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  variant?: "default" | "dashboard";
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
  disabled = false,
  className,
  variant = "default",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(256);
  const [dropdownPosition, setDropdownPosition] = useState<{
    left: number;
    width: number;
    top: number;
    bottom: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        containerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
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

  // Posición del listado (viewport): useLayoutEffect evita un frame sin portal y solapa bien otros selects.
  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }
    if (!buttonRef.current) return;

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

      setDropdownPosition({
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 8,
        bottom: viewportHeight - rect.top + 8,
      });
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

  const optionButtons = options.map((option, index) => (
    <button
      type="button"
      key={option.value}
      role="option"
      aria-selected={value === option.value}
      onClick={() => handleSelect(option.value)}
      onMouseEnter={() => setHighlightedIndex(index)}
      onMouseLeave={() => setHighlightedIndex(-1)}
      className={cn(
        "w-full px-4 py-3 text-left text-sm transition-all duration-200 focus:outline-none",
        variant === "dashboard"
          ? "bg-[hsl(220_18%_14%_/_1)] text-foreground hover:bg-[hsl(220_18%_18%_/_1)]"
          : "bg-transparent text-foreground hover:bg-white/12",
        value === option.value
          ? variant === "dashboard"
            ? "bg-[hsl(168_70%_24%_/_1)] text-foreground border-l-2 border-primary pl-3"
            : "bg-primary/20 text-primary-foreground border-l-2 border-primary pl-3"
          : "text-foreground/100",
        highlightedIndex === index && value !== option.value
          ? variant === "dashboard"
            ? "bg-[hsl(220_18%_18%_/_1)]"
            : "bg-white/5"
          : ""
      )}
    >
      {option.label}
    </button>
  ));

  const portalDropdown =
    isOpen && !disabled && dropdownPosition ? (
      <div
        ref={listRef}
        role="listbox"
        className={cn(
          "fixed z-[9999] pointer-events-auto rounded-2xl shadow-lg overflow-y-auto py-2",
          variant === "dashboard" ? "dashboard-select-panel" : "checkout-dropdown-panel"
        )}
        style={{
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          maxHeight: `${dropdownMaxHeight}px`,
          top: openUpward ? undefined : `${dropdownPosition.top}px`,
          bottom: openUpward ? `${dropdownPosition.bottom}px` : undefined,
        }}
      >
        {optionButtons}
      </div>
    ) : null;

  return (
    // Contenedor principal del select personalizado
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        variant === "dashboard" ? "isolate" : "",
        isOpen ? "z-[100]" : "z-10",
        className
      )}
    >
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          // Misma base que los inputs del checkout (.checkout-input en globals.css)
          "checkout-input flex w-full min-h-[2.75rem] items-center justify-between gap-2 transition-all duration-300",
          variant === "dashboard"
            ? "text-right dashboard-select-trigger"
            : "text-left",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}  
      >
        <span className={cn("min-w-0 flex-1 truncate", selectedOption ? "text-foreground" : "text-muted-foreground")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 transition-transform duration-300 text-muted-foreground",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {portalDropdown ? createPortal(portalDropdown, document.body) : null}
    </div>
  );
}
