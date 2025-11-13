const fs = require('fs');
const path = require('path');

/**
 * Script para copiar recursos Android customizados de resources/android/res
 * para android/app/src/main/res após o npx cap sync
 * 
 * Este script garante que os ícones customizados sejam copiados para o projeto Android,
 * substituindo os ícones padrão do Capacitor.
 */

const SOURCE_DIR = path.join(__dirname, '..', 'resources', 'android', 'res');
const TARGET_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Diretório de origem não encontrado: ${src}`);
    return false;
  }

  // Criar diretório de destino se não existir
  if (!fs.existsSync(dest)) {
    console.warn(`⚠️  Diretório Android não encontrado: ${dest}`);
    console.log('💡 Execute "npx cap add android" primeiro para criar o projeto Android.');
    return false;
  }

  let copiedFiles = 0;
  let copiedDirs = 0;

  function copyDir(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
          copiedDirs++;
        }
        copyDir(srcPath, destPath);
      } else {
        // Copiar arquivo, sobrescrevendo se já existir
        fs.copyFileSync(srcPath, destPath);
        copiedFiles++;
      }
    }
  }

  try {
    copyDir(src, dest);
    console.log(`✅ Copiados ${copiedFiles} arquivo(s) e ${copiedDirs} diretório(s)`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao copiar recursos: ${error.message}`);
    return false;
  }
}

console.log('📦 Copiando recursos Android customizados...');
console.log(`   Origem: ${path.relative(process.cwd(), SOURCE_DIR)}`);
console.log(`   Destino: ${path.relative(process.cwd(), TARGET_DIR)}`);
console.log('');

const success = copyRecursive(SOURCE_DIR, TARGET_DIR);

if (success) {
  console.log('');
  console.log('✅ Recursos Android copiados com sucesso!');
  console.log('💡 Os ícones customizados serão usados no próximo build do APK.');
  process.exit(0);
} else {
  console.log('');
  console.log('⚠️  Recursos não foram copiados. Verifique os avisos acima.');
  console.log('💡 Isso é normal se o projeto Android ainda não foi criado.');
  process.exit(0); // Não falha o build, apenas avisa
}

