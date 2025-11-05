# Creeda Mascot Components

## Available Images
- `creeda.png` - Main/default side view
- `creeda-side.png` - Side profile view
- `creeda-front.png` - Front-facing view
- `creeda-angle.png` - Angled view
- `creeda-side-alt.png` - Alternate side view
- `creeda-back.png` - Back view

## Components

### CreedaHeroToucan
The main hero component with automatic angle rotation.

**Props:**
- `className?: string` - Additional CSS classes
- `enableRotation?: boolean` - Enable/disable automatic angle cycling (default: true)

**Usage:**
```tsx
import CreedaHeroToucan from '@/components/CreedaHeroToucan'

<CreedaHeroToucan className="w-full max-w-[420px]" enableRotation={true} />
```

**Features:**
- Automatically cycles through 5 different angles every 4 seconds
- Smooth 3D rotation transitions between angles
- Navigation dots to manually switch angles
- Floating animation with gentle bob and scale
- Respects `prefers-reduced-motion`

---

### CreedaMascot
Flexible component for showing specific angles anywhere on the site.

**Props:**
- `className?: string` - Additional CSS classes
- `angle?: "main" | "side" | "front" | "angle" | "side-alt" | "back"` - Which angle to display (default: "main")
- `size?: "sm" | "md" | "lg" | "xl"` - Predefined sizes (default: "md")
  - `sm`: 96px (24rem)
  - `md`: 192px (48rem)
  - `lg`: 256px (64rem)
  - `xl`: 384px (96rem)
- `animate?: boolean` - Enable floating animation (default: true)

**Usage Examples:**
```tsx
import CreedaMascot from '@/components/CreedaMascot'

// Front-facing mascot in the CTA section
<CreedaMascot angle="front" size="lg" />

// Small back view without animation
<CreedaMascot angle="back" size="sm" animate={false} />

// Side view with custom styling
<CreedaMascot 
  angle="side" 
  size="md" 
  className="absolute top-0 right-0" 
/>
```

---

## Recommended Usage Patterns

### Hero Section
Use `CreedaHeroToucan` with rotation enabled for maximum visual interest:
```tsx
<CreedaHeroToucan className="w-full max-w-[420px]" />
```

### Feature Sections
Use `CreedaMascot` with contextual angles:
- `"front"` - For welcoming CTAs
- `"side"` - For service descriptions
- `"angle"` - For testimonials or about sections
- `"back"` - For footer or farewell sections

### Navigation
Use the simple logo in the navbar (already implemented):
```tsx
<img src={creedaImage} alt="Creeda" className="h-12 w-12 object-contain" />
```

---

## Animation Details

Both components include:
- **Floating Effect**: Gentle up/down motion (y-axis)
- **Subtle Rotation**: Slight tilt animation
- **Scale Breathing**: Gentle size pulsing
- **Accessibility**: All animations disabled when user prefers reduced motion
- **Performance**: GPU-accelerated transforms

## Adding New Angles

To add more angles:
1. Add the image to `/src/assets/images/` with naming pattern `creeda-[descriptor].png`
2. Import it in both component files
3. Add to the `creedaAngles` array in `CreedaHeroToucan`
4. Add to the `angleImages` object in `CreedaMascot`
5. Update the TypeScript `angle` type union
