/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core Background
        background: '#050810',
        'lynq-dark': '#050810',
        'lynq-darker': '#020408',
        'lynq-card': '#0a0f1a',
        'lynq-card-hover': '#0f1628',

        // Primary Brand
        'electric-blue': '#2979FF',
        'neon-cyan': '#00E5FF',
        'deep-purple': '#651FFF',
        'magenta': '#D500F9',
        'aurora-green': '#00FFA3',

        // Glass Effects
        'glass-white': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-strong': 'rgba(255, 255, 255, 0.15)',

        // Semantic Colors
        success: '#00E676',
        warning: '#FFB300',
        error: '#FF5252',
        info: '#29B6F6',

        // Trust Tiers
        'tier-bronze': '#CD7F32',
        'tier-silver': '#C0C0C0',
        'tier-gold': '#FFD700',
        'tier-platinum': '#E5E4E2',
        'tier-diamond': '#B9F2FF',

        // Risk Levels
        'risk-low': '#00E676',
        'risk-medium': '#FFB300',
        'risk-high': '#FF5252',
        'risk-critical': '#D50000',

        // ML Confidence
        'confidence-high': '#00E676',
        'confidence-medium': '#FFB300',
        'confidence-low': '#FF5252',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2rem', { lineHeight: '1.25' }],
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(0, 229, 255, 0.15)',
        'glow-md': '0 0 40px rgba(0, 229, 255, 0.2)',
        'glow-lg': '0 0 60px rgba(0, 229, 255, 0.25)',
        'glow-purple': '0 0 40px rgba(101, 31, 255, 0.3)',
        'glow-success': '0 0 30px rgba(0, 230, 118, 0.3)',
        'glow-error': '0 0 30px rgba(255, 82, 82, 0.3)',
        'inner-glow': 'inset 0 0 40px rgba(0, 229, 255, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 229, 255, 0.15)',
      },
      dropShadow: {
        'glow': '0 0 20px rgba(0, 229, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(101, 31, 255, 0.5)',
        'glow-success': '0 0 20px rgba(0, 230, 118, 0.5)',
      },
      backgroundImage: {
        // Premium Gradients
        'gradient-primary': 'linear-gradient(135deg, #2979FF 0%, #00E5FF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #651FFF 0%, #D500F9 100%)',
        'gradient-success': 'linear-gradient(135deg, #00E676 0%, #00FFA3 100%)',
        'gradient-danger': 'linear-gradient(135deg, #FF5252 0%, #FF1744 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0f1a 0%, #050810 100%)',
        'gradient-radial-glow': 'radial-gradient(ellipse at center, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
        'gradient-radial-purple': 'radial-gradient(ellipse at center, rgba(101, 31, 255, 0.08) 0%, transparent 70%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(0, 229, 255, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(101, 31, 255, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 255, 163, 0.05) 0px, transparent 50%)',
        // Glass Pattern
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'glass-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        // Entrance Animations
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',

        // Continuous Animations
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',

        // Interaction Animations
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'ripple': 'ripple 0.6s linear',

        // ML Specific
        'score-reveal': 'scoreReveal 1.5s ease-out forwards',
        'tier-upgrade': 'tierUpgrade 0.8s ease-out forwards',
        'confidence-pulse': 'confidencePulse 2s ease-in-out infinite',
        'risk-alert': 'riskAlert 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        scoreReveal: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' },
          '50%': { transform: 'scale(1.1) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        tierUpgrade: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        confidencePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        riskAlert: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 82, 82, 0)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 30px rgba(255, 82, 82, 0.5)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 82, 82, 0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
