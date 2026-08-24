import Image from "next/image";
import type { ScenarioCoverProps } from "@/types/components";

export function ScenarioCover({ scenario }: ScenarioCoverProps) {
  const { art } = scenario;
  if (!art.src) return null;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ink/10 bg-accent/8">
      <Image
        src={art.src}
        alt={art.alt}
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}
