import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import creedaLogo from "@/assets/images/creedava-logo.png";
import creedaAgent1 from "@/assets/images/creedava-agent-1.png";
import creedaAgent2 from "@/assets/images/creedava-agent-2.png";
import creedaAgent3 from "@/assets/images/creedava-agent-3.png";

type CreedaMascotProps = {
  className?: string;
  pose?: "main" | "working" | "flying-left" | "flying-right" | "flying-front" | "flying-free" | "front-side" | "side" | "looking-back" | "upside" | "office-chair" | "front-up";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
};

const poseImages = {
  main: creedaLogo,
  working: creedaAgent2,
  "flying-left": creedaAgent1,
  "flying-right": creedaAgent1,
  "flying-front": creedaLogo,
  "flying-free": creedaLogo,
  "front-side": creedaAgent3,
  side: creedaAgent2,
  "looking-back": creedaAgent1,
  upside: creedaAgent3,
  "office-chair": creedaAgent2,
  "front-up": creedaAgent3,
};

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-48 h-48",
  lg: "w-64 h-64",
  xl: "w-96 h-96",
};

export const CreedaMascot = memo(
  ({ className, pose = "main", size = "md", animate = true }: CreedaMascotProps) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;

    return (
      <motion.div
        className={cn("relative inline-block", sizeClasses[size], className)}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.img
          src={poseImages[pose]}
          alt={`CreedaVA - ${pose}`}
          className="w-full h-full object-contain drop-shadow-xl"
          animate={
            shouldAnimate
              ? {
                  y: [0, -8, 0],
                  rotate: [0, 2, -2, 0],
                  transition: {
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  },
                }
              : undefined
          }
        />
      </motion.div>
    );
  }
);

CreedaMascot.displayName = "CreedaMascot";

export default CreedaMascot;
