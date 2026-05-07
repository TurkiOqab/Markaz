import tailwindcssRtl from 'tailwindcss-rtl';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['Tajawal', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f7f1',
          100: '#d6ebd9',
          200: '#b3dabd',
          300: '#82c694',
          400: '#4eb068',
          500: '#28a046',
          600: '#208a3b',
          700: '#1a7a3a',
          800: '#155f2c',
          900: '#103e1f',
        },
        surface: {
          50:  '#f5faf5',
          100: '#f0f7f0',
          200: '#eaf2ea',
          300: '#e2ede2',
          500: '#6a8a6a',
          900: '#1a2e1a',
        },
        // Design tokens for the editorial login (Variant 3): a deeper saudi-green
        // ramp, gold accents, ink scale for body/labels, and a warm paper.
        injaz: {
          green: {
            900: '#0d3a24',
            800: '#14502f',
            700: '#1a6b3d',
            600: '#228550',
            500: '#2da366',
            400: '#5cc28a',
            100: '#e8f4ed',
            50:  '#f3f9f5',
          },
          gold:     '#c8a96a',
          'gold-soft': '#e8d9b8',
          ink: {
            900: '#0a1f15',
            700: '#2c3e36',
            500: '#5b6b62',
            300: '#9aa8a0',
            100: '#d8e0db',
          },
          paper:  '#fafbf9',
          danger: '#c0392b',
        },
      },
      boxShadow: {
        'soft-green': '0 1px 2px rgba(34,122,34,0.06), 0 4px 12px rgba(34,122,34,0.06)',
        'lift-green': '0 4px 12px rgba(34,122,34,0.10), 0 12px 32px rgba(34,122,34,0.08)',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.65', transform: 'scale(1.06)' },
        },
        // ---------- Login → Welcome → Dashboard slide transition ----------
        // All slides use the same easing (cubic-bezier(0.65,0,0.35,1)) so the
        // exiting and entering panels feel mechanically linked.
        loginPageExit: {
          '0%':   { transform: 'translateX(0)',     opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '1' },
        },
        welcomeEnter: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        welcomeExit: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        appSlideIn: {
          // Repurposed: smooth fade + slight scale for the post-welcome handoff.
          // Matches the welcome's blur/scale exit instead of a horizontal slide.
          '0%':   { opacity: '0', transform: 'scale(1.01)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Welcome content stagger — delays are measured from when the welcome
        // panel first mounts (i.e. start of stage 1).
        splashLogo: {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        splashFadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        splashFade: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // ---------- Editorial login (Variant 3) ----------
        shapeDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%':      { transform: 'translate(-12px, 8px) scale(1.02)' },
        },
        statusPulse: {
          '0%':   { transform: 'scale(1)',   opacity: '0.4' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-6px)' },
          '75%':      { transform: 'translateX(6px)' },
        },
        fadeSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        // ---------- Welcome page ----------
        welcomeReveal: {
          '0%':   { opacity: '0', transform: 'scale(1.015)', filter: 'blur(6px)' },
          '100%': { opacity: '1', transform: 'scale(1)',     filter: 'blur(0)' },
        },
        welcomeLeave: {
          '0%':   { opacity: '1', transform: 'scale(1)',    filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(0.985)', filter: 'blur(4px)' },
        },
        loginBlurOut: {
          '0%':   { opacity: '1', transform: 'scale(1)',    filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(0.985)', filter: 'blur(4px)' },
        },
        sheenSweep: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        veilSweep: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        goldSweep: {
          '0%':   { transform: 'translateX(0)',     opacity: '0' },
          '10%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { transform: 'translateX(-260vw)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 200ms cubic-bezier(0.4,0,0.2,1) both',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
        // 800ms slides for login-out / welcome-in / welcome-out / app-in.
        'login-page-exit': 'loginPageExit 800ms cubic-bezier(0.65,0,0.35,1) both',
        'welcome-enter':   'welcomeEnter   800ms cubic-bezier(0.65,0,0.35,1) both',
        'welcome-exit':    'welcomeExit    800ms cubic-bezier(0.65,0,0.35,1) both',
        'app-slide-in':    'appSlideIn     500ms cubic-bezier(0.22,0.61,0.36,1) both',
        // Welcome panel content (delays from start of stage 1):
        //   logo:    enters at 800ms  (right after slide-in finishes)
        //   welcome: enters at 1000ms
        //   brand:   enters at 1200ms
        'splash-logo':    'splashLogo    600ms ease-out both 800ms',
        'splash-welcome': 'splashFadeUp 500ms ease-out both 1000ms',
        'splash-brand':   'splashFadeUp 500ms ease-out both 1200ms',
        'splash-rule':    'splashFade   400ms ease-out both 1400ms',
        // ---------- Editorial login (Variant 3) ----------
        'shape-drift':   'shapeDrift   18s ease-in-out infinite',
        'status-pulse': 'statusPulse 2s ease-out infinite',
        'shake':         'shake        0.4s ease',
        'fade-slide-1':  'fadeSlideUp  0.5s ease 0.05s forwards',
        'fade-slide-2':  'fadeSlideUp  0.5s ease 0.12s forwards',
        'fade-slide-3':  'fadeSlideUp  0.5s ease 0.20s forwards',
        'fade-slide-4':  'fadeSlideUp  0.5s ease 0.28s forwards',
        'fade-slide-5':  'fadeSlideUp  0.5s ease 0.36s forwards',
        'fade-slide-6':  'fadeSlideUp  0.5s ease 0.44s forwards',
        'spin-fast':     'spin         0.7s linear infinite',
        // ---------- Welcome page ----------
        'welcome-reveal': 'welcomeReveal 700ms cubic-bezier(0.22,0.61,0.36,1) both',
        'welcome-leave':  'welcomeLeave  500ms cubic-bezier(0.55,0,0.68,0)   both',
        'login-blur-out': 'loginBlurOut  600ms cubic-bezier(0.55,0,0.68,0)   both',
        'sheen-sweep':    'sheenSweep    900ms cubic-bezier(0.5,0,0.2,1) 100ms both',
        'veil-sweep':     'veilSweep     1000ms cubic-bezier(0.65,0,0.35,1) both',
        'gold-sweep':     'goldSweep     1000ms cubic-bezier(0.5,0,0.2,1) both',
        'shape-drift-slow': 'shapeDrift 22s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'rail': 'cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [tailwindcssRtl],
};
