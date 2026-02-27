import { cn } from "../../utils/cn";

const variantClassMap = {
  default: "bg-white text-black",
  inverted: "bg-black text-white",
  muted: "bg-neutral-100 text-neutral-700"
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-black px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
        variantClassMap[variant] || variantClassMap.default,
        className
      )}
      {...props}
    />
  );
}

export default Badge;
