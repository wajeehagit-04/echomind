import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const base =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 font-sans text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-background hover:bg-accent/90",
  secondary: "border border-hairline bg-surface text-ink hover:border-accent/60",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}
