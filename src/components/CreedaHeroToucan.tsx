import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import creedaHero from "@/assets/images/creeda-flying-headset-on.png";

type CreedaHeroToucanProps = {
  className?: string;
};

export const CreedaHeroToucan = memo(({ className }: CreedaHeroToucanProps) => {
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;

  return (
    <motion.div
      className={cn("relative flex items-center justify-center", className)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-sky-500/25 via-emerald-400/10 to-purple-500/20" aria-hidden />
      
      <motion.img
        src={creedaHero}
        alt="Creeda the toucan flying with headset"
        className="relative w-full h-auto drop-shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={
          animate
            ? {
                scale: [0.95, 1, 0.95],
                opacity: 1,
                y: [0, -15, 0],
                rotate: [0, 2, -2, 0],
                transition: {
                  scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.6 }
                }
              }
            : { scale: 1, opacity: 1 }
        }
      />
    </motion.div>
  );
});

CreedaHeroToucan.displayName = "CreedaHeroToucan";

export default CreedaHeroToucan;
