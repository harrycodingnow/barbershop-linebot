import { cn } from "../../utils/cn";

const variantClassMap = {
  primary: "bg-forest text-white hover:bg-forest-light shadow-soft hover:shadow-soft-md hover:-translate-y-0.5",
  selected: "bg-forest text-white shadow-soft",
  outline: "bg-transparent border border-sage text-sage hover:bg-clay-softer hover:text-forest hover:border-forest shadow-sm",
  ghost: "border-transparent bg-transparent text-sage hover:text-forest",
  muted: "bg-clay-softer text-forest hover:bg-clay-light"
};

function Button({
  as = "button",
  variant = "primary",
  className,
  type = "button",
  ...props
}) {
  const Comp = as;

  return (
    <Comp
      type={as === "button" ? type : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-alabaster",
        "disabled:cursor-not-allowed disabled:bg-stone disabled:text-neutral-400 disabled:border-transparent",
        "active:scale-[0.98]",
        variantClassMap[variant] || variantClassMap.primary,
        className
      )}
      {...props}
    />
  );
}

export default Button;
