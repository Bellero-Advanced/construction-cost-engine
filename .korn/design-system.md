# Construction Cost Engine - Design System

**Date:** 2026-05-18  
**Status:** Active  
**Source:** Adapted from Factory Landing Korn Framework

---

## 🎨 Design Philosophy

**Construction Cost Engine Design Language:**
- **Industrial/Technical** - Engineering-focused, data-dense
- **Ink & Paper aesthetic** - Light background with dark text (inverted from Factory Landing)
- **Subtle animations** - 200-300ms spring physics
- **Professional, not flashy** - Research/Academic tool aesthetics
- **60-30-10 color rule** - Amber accent, Paper backgrounds, Ink text

---

## 📦 Component Composition Patterns

### 1. Card System (Compound Components)

```
Card (Container: border, shadow, bg-paper)
├── CardHeader (Flex: items-start, justify-between, p-6, border-b)
│   ├── CardTitle (Text: text-xl, font-semibold, text-ink)
│   ├── CardDescription (Text: text-sm, text-ink-2, mt-1)
│   └── CardAction (Slot: IconButton)
├── CardContent (Slot: children, p-6)
├── CardFooter (Flex: items-center, justify-between, p-6, border-t)
│   ├── CardFooterLeft (Slot: secondary actions)
│   └── CardFooterRight (Slot: primary actions)
└── CardBadge (Position: absolute, top-4, right-4, z-10)
```

**Variants:**
- `variant`: `default` | `outlined` | `elevated`
- `size`: `sm` | `md` | `lg`
- `interactive`: `boolean` (hover effects)

---

### 2. Button Enhancements

**Features:**
- `loading` state with spinner
- `icon` support (left/right position)
- `fullWidth` prop
- Hover lift effect (-translate-y-0.5)
- Active press effect (translate-y-0)

**Variants:**
- `primary` - Amber with hover lift
- `secondary` - Paper-2 with subtle hover
- `outline` - Border with hover fill
- `ghost` - Transparent with hover bg

**Sizes:**
- `xs` - h-7, px-2.5, text-xs
- `sm` - h-8, px-3, text-sm
- `md` - h-10, px-4, text-sm (default)
- `lg` - h-12, px-6, text-base
- `xl` - h-14, px-8, text-lg

---

### 3. Input Enhancements

**Features:**
- `error` state (red border + bg)
- `success` state (green border + bg)
- `prefix` support (icon/text before input)
- `suffix` support (icon/text after input)
- `clearable` with X button
- Focus ring animation

---

### 4. Badge Enhancements

**Variants:**
- `default` - Muted
- `success` - Green (approved, completed)
- `warning` - Amber (pending, on-hold)
- `danger` - Red (rejected, error)
- `info` - Blue (in-progress)
- `primary` - Amber (active, featured)

**Sizes:**
- `sm` - px-2, py-0.5, text-xs
- `md` - px-2.5, py-0.5, text-xs (default)
- `lg` - px-3, py-1, text-sm

---

## 🎨 Design Tokens

### Colors (60-30-10 Rule)

**Construction Cost Engine Palette:**
```css
/* 60% Backgrounds */
--paper: #f5f1e8 (warm paper)
--paper-2: #ede5d3
--muted: rgba(10, 22, 40, 0.05)

/* 30% Text & UI */
--ink: #0a1628 (dark text)
--ink-2: #11253f
--ink-3: #1a3556
--line: #2a4769

/* 10% Accent */
--amber: #d97706
--amber-bright: #f59e0b
--grid: rgba(217, 119, 6, 0.07)

/* Store Brand Colors */
--tpso: #1a3556
--cgd: #b94d2c
--homepro: #e30613
--globalhouse: #f37021
--thaiwatsadu: #009a3d
--bnb: #003a70
```

### Typography

```css
/* Font Families */
--font-sans: 'IBM Plex Sans Thai', sans-serif (UI text)
--font-mono: 'JetBrains Mono', monospace (data/numbers)
--font-display: 'Bebas Neue', sans-serif (headings)

/* Font Sizes */
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px)
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 1.875rem (30px)
```

### Spacing

```css
/* Scale: 4px base */
--spacing-1: 0.25rem (4px)
--spacing-2: 0.5rem (8px)
--spacing-3: 0.75rem (12px)
--spacing-4: 1rem (16px)
--spacing-5: 1.25rem (20px)
--spacing-6: 1.5rem (24px)
--spacing-8: 2rem (32px)
```

### Shadows

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.1)
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.15)
--shadow-lg: 0 10px 40px rgba(0,0,0,0.2)
```

### Animations

```css
/* Duration */
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms

/* Easing */
--ease-spring: cubic-bezier(0.22, 1, 0.36, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
```

### Border Radius

```css
--radius: 0.375rem (6px) - rounded-md
--radius-sm: 0.25rem (4px) - rounded-sm
--radius-lg: 0.5rem (8px) - rounded-lg
--radius-full: 9999px - rounded-full
```

---

## 🔧 Usage Examples

### Example 1: Calculator Card
```tsx
<Card variant="elevated" interactive>
  <CardHeader>
    <div>
      <CardTitle>งานผนัง-กระเบื้อง</CardTitle>
      <CardDescription>คำนวณต้นทุนต่อตารางเมตร</CardDescription>
    </div>
    <CardBadge variant="success">Section A</CardBadge>
  </CardHeader>
  <CardContent>
    <CalculatorForm />
  </CardContent>
  <CardFooter>
    <CardFooterLeft>
      <Badge variant="info">Mock Data</Badge>
    </CardFooterLeft>
    <CardFooterRight>
      <Button variant="primary">คำนวณ</Button>
    </CardFooterRight>
  </CardFooter>
</Card>
```

### Example 2: Data Source Badge
```tsx
<Badge 
  variant="primary" 
  size="md"
  style={{ backgroundColor: 'var(--tpso)' }}
>
  TPSO
</Badge>
```

---

## 📝 Design Principles

### 1. Compound Components Pattern
✅ Card uses compound components (not flat props)
✅ Flexible composition
✅ Clear hierarchy

### 2. Micro-interactions
✅ Button hover lift (-translate-y-0.5)
✅ Button active press (translate-y-0)
✅ Input focus ring animation
✅ Badge pulse animation

### 3. Industrial/Technical Identity
✅ Paper background (not dark)
✅ Grid pattern overlay
✅ Monospace fonts for data
✅ Display fonts for headings
✅ Amber accent for CTAs

### 4. Construction-Specific
✅ Professional, not flashy
✅ Data-dense but readable
✅ Light theme for readability
✅ Store brand colors for sources

---

## ✅ Quality Checks

- ✅ TypeScript: strict mode
- ✅ All components memoized
- ✅ Light theme optimized
- ✅ Accessibility (focus states, ARIA)
- ✅ Responsive (mobile-friendly)
- ✅ i18n-ready (TH/EN)

---

**Construction Cost Engine Design System** = Korn Framework + Industrial/Technical Aesthetics
