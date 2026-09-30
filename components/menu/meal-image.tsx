import Image from "next/image";
import { mealImageUrl } from "@/lib/catalog/images";
import { cn } from "@/lib/utils";

export function MealImage({
  path,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
  priority,
}: {
  path: string | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const src = mealImageUrl(path);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      // Storage images skip the optimizer so they work even when the Supabase
      // host wasn't known at build time.
      unoptimized={src.startsWith("http")}
      className={cn("object-cover", className)}
    />
  );
}
