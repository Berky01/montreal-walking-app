import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container",
  secondary: "border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container-low",
  danger: "bg-error text-white hover:bg-red-800"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 gap-2 px-3 text-label-sm",
  md: "h-11 gap-2 px-4 text-label-md",
  lg: "h-12 gap-2 px-5 text-label-md"
};

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function ButtonLink({ children, className, href, variant = "primary", size = "md", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-control font-semibold transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
