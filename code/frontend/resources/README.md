# Recursos do App Mobile

Esta pasta contém os recursos (ícones e splash screens) para o app mobile.

## Ícones

O ícone base está em `public/img/icon.png`. 

Para gerar todos os tamanhos necessários, você pode usar ferramentas online como:
- https://www.appicon.co/
- https://icon.kitchen/
- https://www.makeappicon.com/

Ou usar o Capacitor CLI (requer Node >= 20):
```bash
npx capacitor-assets generate
```

### Tamanhos necessários:

#### Android:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

#### iOS:
- 20pt: 20x20, 40x40, 60x60
- 29pt: 29x29, 58x58, 87x87
- 40pt: 40x40, 80x80, 120x120
- 60pt: 120x120, 180x180
- 76pt: 76x76, 152x152
- 83.5pt: 167x167
- 1024pt: 1024x1024 (App Store)

## Splash Screen

O splash screen deve usar o ícone centralizado com fundo branco.

### Tamanhos necessários:

#### Android:
- mdpi: 320x470
- hdpi: 480x640
- xhdpi: 720x960
- xxhdpi: 960x1280
- xxxhdpi: 1280x1920

#### iOS:
- iPhone: 750x1334, 1242x2208, 1125x2436, 828x1792, 1242x2688
- iPad: 1536x2048, 2048x2732

## Nota

Os recursos serão copiados automaticamente pelo Capacitor quando você executar `npx cap sync`.

### Copiando Recursos Customizados

Se os recursos customizados não estiverem sendo copiados automaticamente, um script está configurado para garantir a cópia:

```bash
# O script é executado automaticamente após npx cap sync
npm run cap:sync

# Ou execute manualmente
npm run cap:copy-resources
```

O script copia os recursos de `resources/android/res/` para `android/app/src/main/res/`, substituindo os ícones padrão do Capacitor pelos ícones customizados.

