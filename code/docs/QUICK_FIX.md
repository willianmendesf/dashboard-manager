# 🔧 Solução Rápida para Erro de Compilação

## ❌ Erro Atual
```
class file has wrong version 61.0, should be 52.0
```

**Causa:** O sistema está usando Java 8, mas o projeto requer Java 21.

## ✅ Solução Rápida

### Passo 1: Instalar Java 21

**Opção A - Eclipse Adoptium (Recomendado):**
1. Acesse: https://adoptium.net/temurin/releases/?version=21
2. Baixe o Windows x64 JDK
3. Instale (deixe marcado "Set JAVA_HOME variable")

**Opção B - Microsoft Build:**
1. Acesse: https://learn.microsoft.com/en-us/java/openjdk/download
2. Baixe OpenJDK 21
3. Instale

### Passo 2: Configurar JAVA_HOME

**No PowerShell (como Administrador):**
```powershell
# Encontrar Java 21 instalado
Get-ChildItem "C:\Program Files\Java" | Where-Object { $_.Name -like "*21*" }

# Configurar JAVA_HOME (substitua pelo caminho encontrado)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")

# Adicionar ao PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$javaBin = "C:\Program Files\Java\jdk-21\bin"
[System.Environment]::SetEnvironmentVariable("Path", "$javaBin;$currentPath", "User")
```

**Ou use o script automático:**
```powershell
cd backend
.\setup-java21.ps1
```

### Passo 3: Verificar

**Feche e reabra o terminal**, depois:
```bash
java -version
# Deve mostrar: openjdk version "21.x.x"

mvn -version
# Deve mostrar: Java version: 21.x.x
```

### Passo 4: Compilar

```bash
cd backend
mvn clean install
```

## 🚀 Alternativa: Usar Java 17 (se não puder usar 21)

Se não puder instalar Java 21, pode usar Java 17:

1. Instale Java 17
2. Configure JAVA_HOME
3. Atualize `pom.xml`:
   - Mude `<java.version>21</java.version>` para `<java.version>17</java.version>`
   - No `maven-compiler-plugin`, mude `source`, `target` e `release` para `17`

## 📝 Nota

O código está correto. O problema é apenas a versão do Java no ambiente.

