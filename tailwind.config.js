/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // Senior-friendly scale — minimum body text is 20px
        'xs':   ['14px', { lineHeight: '20px' }],
        'sm':   ['16px', { lineHeight: '24px' }],
        'base': ['20px', { lineHeight: '30px' }],
        'lg':   ['24px', { lineHeight: '34px' }],
        'xl':   ['28px', { lineHeight: '38px' }],
        '2xl':  ['32px', { lineHeight: '42px' }],
        '3xl':  ['40px', { lineHeight: '50px' }],
        '4xl':  ['48px', { lineHeight: '58px' }],
      },
      spacing: {
        // Minimum 72px touch targets for primary actions
        'touch': '72px',
      },
      colors: {
        // Existing brand palette
        brand: {
          50:  '#f0f9f4',
          100: '#d9f0e4',
          200: '#b3e0c9',
          300: '#7dc9a7',
          400: '#48ab82',
          500: '#278f65',
          600: '#1a7250',
          700: '#165c41',
          800: '#134935',
          900: '#103c2c',
        },
        // shadcn/ui CSS-variable-based colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      minHeight: {
        'touch': '72px',
      },
      minWidth: {
        'touch': '72px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
