"use client";

import React, { useRef, useEffect, useState } from "react";
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
          : "hover:bg-white/10",
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

  const inlineDropdown = (
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
      {optionButtons}
    </div>
  );

  const dashboardPortalDropdown = dropdownPosition ? (
    <div
      ref={listRef}
      role="listbox"
      className={cn(
        "fixed z-[9999] pointer-events-auto dashboard-select-panel",
        "rounded-lg shadow-lg overflow-y-auto py-2"
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
        variant === "dashboard" && isOpen ? "z-[9998]" : "z-10",
        className
      )}
    >
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "checkout-input flex items-center justify-between w-full",
          "bg-glass border-1.5 border-glass rounded-lg",
          "text-right transition-all duration-300",
          variant === "dashboard" && "dashboard-select-trigger",
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

      {isOpen && !disabled && variant !== "dashboard" && inlineDropdown}
      {isOpen && !disabled && variant === "dashboard" && dashboardPortalDropdown
        ? createPortal(dashboardPortalDropdown, document.body)
        : null}
    </div>
  );
}
