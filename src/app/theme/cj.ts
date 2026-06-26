import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

export const Custom = definePreset(Lara, {
  semantic: {
    primary: {
      50:  '#c1ded4',
      100: '#b7d5c9',
      200: '#a9ccbf',
      300: '#8fbbae',
      400: '#6ca091',
      500: '#315d53', // verde oscuro - principal
      600: '#294b43',
      700: '#203a33',
      800: '#182a25',
      900: '#101b17',
      950: '#0a120f'
    }
  }
});