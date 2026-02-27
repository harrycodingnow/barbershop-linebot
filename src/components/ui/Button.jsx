import { cn } from "../../utils/cn";

const variantClassMap = {
  primary: "bg-black text-white hover:bg-white hover:text-black",
  outline: "bg-white text-black hover:bg-black hover:text-white",
  ghost: "border-transparent bg-transparent px-0 py-0 text-black hover:underline",
  muted: "bg-neutral-100 text-black hover:bg-neutral-200"
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
        "inline-flex min-h-11 items-center justify-center border-2 border-black px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-100",
        "focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3",
        "disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500",
        variantClassMap[variant] || variantClassMap.primary,
        className
      )}
      {...props}
    />
  );
}

export default Button;
