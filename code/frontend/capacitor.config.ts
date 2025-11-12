import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.ipbf.dashboard',
  appName: 'IPBF',
  webDir: 'dist/dashboard/browser',
  server: {
    // URL será carregada dinamicamente via app-config.json
    // Por padrão, usa a URL de produção
    url: process.env['CAPACITOR_SERVER_URL'] || 'http://prod002.ison-duck.ts.net/landing',
    cleartext: true, // Permite HTTP (não apenas HTTPS)
    allowNavigation: [
      'http://prod002.ison-duck.ts.net',
      'https://prod002.ison-duck.ts.net',
      // Adicione outros domínios aqui quando necessário
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

