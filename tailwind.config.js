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
      },
      minHeight: {
        'touch': '72px',
      },
      minWidth: {
        'touch': '72px',
      },
    },
  },
  plugins: [],
}
