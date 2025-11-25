import { CapacitorConfig } from '@capacitor/cli';

// Lista de URLs de fallback
const SERVER_URLS = [
  'http://vps-1150d229.vps.ovh.net/landing',
  'http://51.178.53.84/landing',
  'http://prod002.ison-duck.ts.net/landing',
];

const config: CapacitorConfig = {
  appId: 'br.com.ipbf.dashboard',
  appName: 'IPBF',
  webDir: 'dist/dashboard/browser',
  server: {
    url: process.env['CAPACITOR_SERVER_URL'] || SERVER_URLS[0],
    cleartext: true,
    allowNavigation: [
      'http://vps-1150d229.vps.ovh.net',
      'https://vps-1150d229.vps.ovh.net',
      'http://51.178.53.84',
      'https://51.178.53.84',
      'http://prod002.ison-duck.ts.net',
      'https://prod002.ison-duck.ts.net',
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;

