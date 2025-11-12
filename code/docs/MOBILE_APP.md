# Guia do App Mobile

Este projeto foi configurado para gerar um app mobile instalável (Android APK e iOS IPA) que carrega o site em uma WebView.

## Como Funciona

O app é um wrapper que:
- Carrega a URL do servidor em uma WebView nativa
- Permite que o site seja acessado como um app instalado
- **Atualiza automaticamente** quando você faz mudanças no site (não precisa atualizar o APK)

## Configuração da URL

A URL do servidor é configurada em `src/assets/app-config.json`:

```json
{
  "serverUrl": "http://prod002.ison-duck.ts.net/home",
  "appName": "IPBF Dashboard",
  "version": "1.0.0"
}
```

Para mudar a URL no futuro:
1. Edite `src/assets/app-config.json`
2. Faça commit e push
3. O GitHub Actions irá gerar um novo APK automaticamente

## Build Automático

O build do APK é feito automaticamente via GitHub Actions quando:
- Você faz push para a branch `main` ou `master`
- Você cria uma release/tag

O APK ficará disponível para download em:
- GitHub Actions artifacts (último build)
- GitHub Releases (se você criar uma release)

## Build Local (Opcional)

Se você quiser fazer build local (requer Node >= 20 e Android Studio):

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Build do Angular
npm run build

# Adicionar plataforma Android (primeira vez)
npx cap add android

# Sincronizar
npx cap sync

# Build do APK
cd android
./gradlew assembleDebug
```

O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

## Recursos (Ícones e Splash Screen)

Os recursos estão em `resources/`. Veja `resources/README.md` para instruções de como gerar todos os tamanhos necessários.

## Estrutura de Arquivos

- `capacitor.config.ts` - Configuração principal do Capacitor
- `src/assets/app-config.json` - Configuração da URL do servidor
- `.github/workflows/build-android.yml` - Workflow de build automático
- `resources/` - Ícones e splash screens

## Notas Importantes

1. **O site continua funcionando normalmente pela URL** - o app é apenas uma alternativa instalável
2. **Mudanças no site aparecem automaticamente** - não precisa atualizar o APK
3. **O APK só precisa ser regenerado quando:**
   - Mudar a URL do servidor
   - Mudar ícone, splash screen ou nome do app
   - Adicionar novas permissões nativas

## Troubleshooting

### Build falha no CI
- Verifique se o Node.js está na versão 20 ou superior
- Verifique se todas as dependências foram instaladas corretamente

### App não carrega a URL
- Verifique se a URL em `app-config.json` está correta
- Verifique se o servidor permite acesso de apps mobile (CORS)
- Verifique se a URL está na lista de `allowNavigation` em `capacitor.config.ts`

