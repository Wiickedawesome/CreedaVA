import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import creedaLogo from "@/assets/images/creedava-logo.png";

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
      <div className="absolute inset-0 blur-3xl" style={{background: 'linear-gradient(135deg, var(--navy-600)/0.2, var(--green-600)/0.1, var(--navy-600)/0.15)'}} aria-hidden />
      
      <motion.img
        src={creedaLogo}
        alt="CreedaVA Professional Logo"
        className="relative w-full h-auto drop-shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={
          animate
            ? {
                scale: [0.95, 1, 0.95],
                opacity: 1,
                y: [0, -8, 0],
                transition: {
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
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
