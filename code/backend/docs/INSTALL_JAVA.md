# 🚀 Instalação Rápida de Java 17

## Método 1: Script Automático (Recomendado)

```powershell
# Execute como Administrador
cd backend
.\install-java17.ps1
```

O script tentará instalar automaticamente usando `winget` (Windows 10/11).

## Método 2: Instalação Manual

### Opção A - Eclipse Adoptium (Recomendado)

1. **Baixar:**
   - Acesse: https://adoptium.net/temurin/releases/?version=17
   - Baixe: **Windows x64 JDK** (arquivo .msi)

2. **Instalar:**
   - Execute o arquivo .msi baixado
   - **IMPORTANTE:** Marque a opção **"Set JAVA_HOME variable"** durante a instalação
   - Clique em "Install"

3. **Verificar:**
   ```powershell
   # Feche e reabra o terminal, depois:
   java -version
   # Deve mostrar: openjdk version "17.x.x"
   ```

### Opção B - Chocolatey (se já tiver instalado)

```powershell
choco install temurin17jdk -y
```

### Opção C - Microsoft Build

1. Acesse: https://learn.microsoft.com/en-us/java/openjdk/download
2. Baixe OpenJDK 17
3. Instale

## Método 3: Configuração Manual do JAVA_HOME

Se o Java já está instalado mas não está configurado:

```powershell
# Encontrar onde o Java foi instalado
Get-ChildItem "C:\Program Files" -Filter "*java*" -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*17*" }

# Configurar JAVA_HOME (substitua pelo caminho encontrado)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot", "User")

# Adicionar ao PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$javaBin = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot\bin"
[System.Environment]::SetEnvironmentVariable("Path", "$javaBin;$currentPath", "User")
```

## Verificação Final

Após instalar:

1. **Feche e reabra o terminal**

2. **Verificar Java:**
   ```bash
   java -version
   # Deve mostrar: openjdk version "17.x.x"
   ```

3. **Verificar Maven:**
   ```bash
   mvn -version
   # Deve mostrar: Java version: 17.x.x
   ```

4. **Compilar o projeto:**
   ```bash
   cd backend
   mvn clean install
   ```

## ⚠️ Problemas Comuns

### "java não é reconhecido como comando"
- Feche e reabra o terminal
- Verifique se o PATH foi atualizado: `$env:Path`

### "JAVA_HOME não configurado"
- Execute o script de configuração manual acima
- Ou reinstale o Java marcando "Set JAVA_HOME variable"

### Maven ainda usa Java antigo
- Verifique: `mvn -version`
- Se ainda mostrar Java 8, configure JAVA_HOME e reinicie o terminal

