import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import creedaMain from "@/assets/images/creeda-front.png";
import creedaWorking from "@/assets/images/creeda-working.png";
import creedaFlyingLeft from "@/assets/images/creeda-flying-side.png";
import creedaFlyingRight from "@/assets/images/creeda-flying-headset-on.png";
import creedaFlyingFront from "@/assets/images/creeda-flying.png";
import creedaFlyingNoHeadset from "@/assets/images/creeda-flying-no-headset.png";
import creedaFrontSide from "@/assets/images/creeda-front-side-view.png";
import creedaSideHeadset from "@/assets/images/creeda-side-headphone-view.png";
import creedaLookBackwards from "@/assets/images/creeda-looking-backwards.png";
import creedaUpSide from "@/assets/images/creeda-behind.png";
import creedaOfficeChair from "@/assets/images/creeda-on-office- chair.png";
import creedaFrontUp from "@/assets/images/creeda-front-up-view.png";

type CreedaMascotProps = {
  className?: string;
  pose?: "main" | "working" | "flying-left" | "flying-right" | "flying-front" | "flying-free" | "front-side" | "side" | "looking-back" | "upside" | "office-chair" | "front-up";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
};

const poseImages = {
  main: creedaMain,
  working: creedaWorking,
  "flying-left": creedaFlyingLeft,
  "flying-right": creedaFlyingRight,
  "flying-front": creedaFlyingFront,
  "flying-free": creedaFlyingNoHeadset,
  "front-side": creedaFrontSide,
  side: creedaSideHeadset,
  "looking-back": creedaLookBackwards,
  upside: creedaUpSide,
  "office-chair": creedaOfficeChair,
  "front-up": creedaFrontUp,
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
          alt={`Creeda the toucan - ${pose}`}
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
