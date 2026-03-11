/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4' },
          '50%':       { opacity: '0.8' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':       { transform: 'scaleY(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' },
        },
        speakRing: {
          '0%':   { opacity: '0.8', transform: 'scale(1)' },
          '100%': { opacity: '0',   transform: 'scale(1.3)' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        panelSlide: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up':         'fadeInUp 0.7s ease forwards',
        'fade-in-up-delay':   'fadeInUp 0.7s ease 0.2s both',
        'fade-in-up-delay2':  'fadeInUp 0.7s ease 0.4s both',
        'pulse-slow':         'pulse-slow 2s infinite',
        'waveform':           'waveform 0.5s ease infinite',
        'pulse-dot':          'pulseDot 2s infinite',
        'pulse-dot-fast':     'pulseDot 1.5s infinite',
        'speak-ring':         'speakRing 1.2s ease infinite',
        'speak-ring-delayed': 'speakRing 1.2s ease 0.4s infinite',
        'feed-item':          'fadeSlideUp 0.3s ease',
        'panel-slide':        'panelSlide 0.3s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
};
