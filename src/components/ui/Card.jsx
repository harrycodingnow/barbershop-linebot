import { cn } from "../../utils/cn";

function Card({ className, inverted = false, ...props }) {
  return (
    <section
      className={cn(
        "border-2 border-black p-6 md:p-8",
        inverted ? "inverted-lines bg-black text-white" : "bg-white text-black",
        className
      )}
      {...props}
    />
  );
}

export default Card;
