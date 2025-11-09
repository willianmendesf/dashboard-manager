# Configuração do Java para o Projeto

## Problema
O projeto requer **Java 21**, mas o sistema está usando **Java 8**.

## Solução

### Opção 1: Instalar Java 21 e Configurar JAVA_HOME (Recomendado)

1. **Baixar Java 21:**
   - Baixe o OpenJDK 21 de: https://adoptium.net/ ou https://www.oracle.com/java/technologies/downloads/#java21
   - Instale no sistema

2. **Configurar JAVA_HOME no Windows:**
   ```powershell
   # Verificar instalação
   java -version
   
   # Configurar JAVA_HOME (substitua pelo caminho real)
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
   
   # Adicionar ao PATH
   $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
   [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\Program Files\Java\jdk-21\bin", "User")
   ```

3. **Reiniciar o terminal** e verificar:
   ```bash
   java -version
   mvn -version
   ```
   
   Ambos devem mostrar Java 21.

### Opção 2: Usar Java 17 (Mínimo para Spring Boot 3.5.5)

Se não puder usar Java 21, pode usar Java 17 (LTS):

1. Baixar Java 17
2. Configurar JAVA_HOME
3. Atualizar `pom.xml`:
   ```xml
   <properties>
       <java.version>17</java.version>
   </properties>
   ```
   E no `maven-compiler-plugin`:
   ```xml
   <source>17</source>
   <target>17</target>
   <release>17</release>
   ```

### Opção 3: Usar Maven Toolchains (Avançado)

Criar arquivo `~/.m2/toolchains.xml`:
```xml
<?xml version="1.0" encoding="UTF8"?>
<toolchains>
  <toolchain>
    <type>jdk</type>
    <provides>
      <version>21</version>
    </provides>
    <configuration>
      <jdkHome>C:/Program Files/Java/jdk-21</jdkHome>
    </configuration>
  </toolchain>
</toolchains>
```

## Verificação

Após configurar, execute:
```bash
cd backend
mvn clean compile -DskipTests
```

Deve compilar sem erros.

