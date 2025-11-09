# Configuração do Java para o Projeto

## Problema
O projeto requer **Java 17 ou superior**, mas o sistema está usando **Java 8**.

## Solução

### Opção 1: Instalar Java 17+ (Recomendado)

1. **Baixar Java 17 ou 21:**
   - Oracle JDK: https://www.oracle.com/java/technologies/downloads/
   - OpenJDK (Zulu): https://www.azul.com/downloads/?package=jdk
   - Adoptium (Eclipse Temurin): https://adoptium.net/

2. **Instalar o Java**

3. **Configurar JAVA_HOME no Windows:**
   ```powershell
   # Verificar instalações do Java
   dir "C:\Program Files\Java"
   
   # Definir JAVA_HOME temporariamente (apenas para esta sessão)
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
   
   # Ou definir permanentemente via variáveis de ambiente do sistema
   # Painel de Controle > Sistema > Configurações Avançadas > Variáveis de Ambiente
   ```

4. **Verificar a versão:**
   ```powershell
   java -version
   # Deve mostrar Java 17 ou superior
   ```

5. **Compilar o projeto:**
   ```powershell
   cd backend
   mvn clean install
   ```

### Opção 2: Usar SDKMAN (Windows com WSL/Git Bash)

Se você tem WSL ou Git Bash instalado:

```bash
# Instalar SDKMAN
curl -s "https://get.sdkman.io" | bash

# Instalar Java 21
sdk install java 21.0.1-tem

# Usar Java 21
sdk use java 21.0.1-tem

# Verificar
java -version
```

### Opção 3: Usar Chocolatey (Windows)

```powershell
# Instalar Chocolatey (se não tiver)
# https://chocolatey.org/install

# Instalar Java 21
choco install openjdk21

# Verificar
java -version
```

## Verificar Configuração

Após instalar Java 17+, execute:

```powershell
# Verificar versão do Java
java -version

# Verificar JAVA_HOME
echo $env:JAVA_HOME

# Verificar versão do Maven
mvn -version
# Deve mostrar "Java version: 17" ou superior
```

## Nota Importante

- **Spring Boot 3.5.5 requer Java 17+**
- Não é possível usar Java 8 com Spring Boot 3.x
- Se precisar usar Java 8, seria necessário fazer downgrade para Spring Boot 2.7.x (não recomendado)

