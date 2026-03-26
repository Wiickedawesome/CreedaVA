"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
      // Focus the dialog on open
      requestAnimationFrame(() => {
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      });
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`relative z-10 flex w-full flex-col ${sizeStyles[size]} rounded-xl border border-border bg-card shadow-xl max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h2 id="modal-title" className="text-lg font-bold text-gray-90 truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-50 hover:bg-gray-20 hover:text-gray-80 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/50 rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
