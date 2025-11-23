<!-- 02559d51-66a5-42ea-a28b-ee36a9abdb3d d4bac631-3082-4691-a5f0-be60b2a2cefb -->
# Sistema Base64 Storage com Thumbnailator

## Objetivo

Adicionar suporte para armazenar imagens em Base64 (LONGTEXT) no MySQL, mantendo compatibilidade total com o sistema atual de arquivos físicos, permitindo alternância via configuração.

## Arquitetura Proposta

### 1. Módulo Reutilizável de Processamento de Imagens

- **ImageProcessor** (utility): Extrai lógica de processamento de imagem
  - Usa Thumbnailator para redimensionamento profissional
  - Redimensiona apenas se > 500px (exceto `manterOriginal=true`)
  - Conversão para Base64
  - Suporta JPG/PNG/GIF/WEBP

### 2. Estratégias de Storage (Strategy Pattern)

- **StorageService** (interface): Mantida como está
- **LocalStorageService**: Implementação atual (disco físico) - não modificar
- **Base64StorageService**: Nova implementação (Base64 em LONGTEXT)
- **HybridStorageService**: Delegador que escolhe estratégia via configuração

### 3. Modelos de Dados

- Adicionar campos LONGTEXT opcionais nas entidades:
  - `User`: `foto_base64` LONGTEXT
  - `MemberEntity`: `foto_base64` LONGTEXT  
  - `VisitorEntity`: `foto_base64` LONGTEXT
  - `BookEntity`: `foto_base64` LONGTEXT
  - `BannerImage`: `image_base64` LONGTEXT
- Campos `foto_url`/`image_url` mantidos para compatibilidade

### 4. Endpoint `/files/upload`

- Adicionar parâmetro opcional: `storageType` (values: `disk` | `base64` | `auto`)
- Default: `auto` (usa configuração do sistema)
- Parâmetro: `manterOriginal` (boolean, default: false)
- Se `manterOriginal=true`: não redimensiona

### 5. Configuração (`application.yml`)

```yaml
storage:
  type: disk  # ou base64
  image:
    max-dimension: 500
    quality: 0.85
```

### 6. Frontend (Angular)

- Atualizar `buildFileImageUrl()` para detectar Base64 (`data:image/...`)
- Se for Base64, usar diretamente no `[src]`
- Se for URL, usar como antes

## Estrutura de Arquivos

```
backend/src/main/java/br/com/willianmendesf/system/
├── service/
│   ├── storage/
│   │   ├── StorageService.java (interface - manter)
│   │   ├── LocalStorageService.java (manter como está)
│   │   ├── Base64StorageService.java (NOVO)
│   │   └── HybridStorageService.java (NOVO - delegador)
│   └── image/
│       └── ImageProcessor.java (NOVO - utility reutilizável)
├── model/
│   └── entity/
│       ├── User.java (adicionar campo foto_base64)
│       ├── MemberEntity.java (adicionar campo foto_base64)
│       ├── VisitorEntity.java (adicionar campo foto_base64)
│       ├── BookEntity.java (adicionar campo foto_base64)
│       └── BannerImage.java (adicionar campo image_base64)
└── configuration/
    └── StorageConfiguration.java (NOVO - configuração Spring)

frontend/src/app/shared/utils/
└── image-url-builder.ts (atualizar para suportar Base64)
```

## Fluxo de Implementação

### Fase 1: Módulo Reutilizável

1. Adicionar dependência Thumbnailator no `pom.xml`
2. Criar `ImageProcessor` utility com métodos:

   - `processImage(MultipartFile, maxDimension, manterOriginal) -> byte[]`
   - `toBase64(byte[], mimeType) -> String`
   - `shouldResize(BufferedImage, maxDimension) -> boolean`

### Fase 2: Base64 Storage Service

3. Criar `Base64StorageService` implementando `StorageService`
4. Usar `ImageProcessor` para processar imagens
5. Salvar Base64 em entidades (via repositórios)
6. `uploadFile()` retorna identificador interno (ex: `base64:user:123`)

### Fase 3: Hybrid Storage Service

7. Criar `HybridStorageService` que delega para estratégia escolhida
8. Configuração via `application.yml`
9. Atualizar `@Configuration` para injetar estratégia correta

### Fase 4: Modelos de Dados

10. Adicionar campos LONGTEXT nas entidades
11. Atualizar DTOs para incluir campos Base64
12. Migração SQL automática (JPA `ddl-auto: update`)

### Fase 5: Endpoint

13. Atualizar `FileUploadController`:

    - Adicionar parâmetro `storageType`
    - Adicionar parâmetro `manterOriginal`
    - Escolher estratégia baseado em parâmetro/config

### Fase 6: Endpoint de Servir Imagens

14. Atualizar `FileController` para servir Base64:

    - Detectar formato `base64:entity:id`
    - Buscar Base64 no banco
    - Retornar como `data:image/...;base64,...`

### Fase 7: Frontend

15. Atualizar `image-url-builder.ts`:

    - Detectar Base64 strings
    - Se Base64, retornar direto
    - Se URL, construir URL completa

### Fase 8: Compatibilidade

16. Manter todos os controllers existentes funcionando
17. URLs antigas continuam servindo do disco
18. Base64 funciona transparente

## Regras de Negócio

1. **Redimensionamento**: 

   - Apenas se imagem > 500px (configurável)
   - Exceto se `manterOriginal=true`
   - Proporção mantida automaticamente

2. **Qualidade**:

   - JPG: 85% (configurável)
   - PNG: Mantém original

3. **Compatibilidade**:

   - Sistema antigo continua funcionando
   - Migração gradual possível
   - Mix de disco e Base64 suportado

4. **Segurança**:

   - Validação de tipo de arquivo mantida
   - Tamanho máximo mantido (100MB)
   - Sanitização de entradas

## Dependências

### Backend (pom.xml)

```xml
<dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.14</version>
</dependency>
```

### Frontend

Nenhuma dependência adicional necessária (Base64 nativo no JS)

## Testes de Compatibilidade

1. ✅ Upload via disco continua funcionando
2. ✅ Upload via Base64 funciona
3. ✅ URLs antigas continuam servindo
4. ✅ Frontend detecta formato automaticamente
5. ✅ Controllers específicos (UserProfileController, etc.) funcionam
6. ✅ Migração gradual possível

## Validações

- ✅ Não quebrar funcionalidades existentes
- ✅ Reutilizar código existente (não duplicar)
- ✅ Seguir padrões da aplicação (Lombok, @RequiredArgsConstructor, etc.)
- ✅ Logging adequado
- ✅ Tratamento de erros consistente

### To-dos

- [ ] Adicionar dependência Thumbnailator no pom.xml
- [ ] Criar ImageProcessor utility class com métodos de processamento e conversão Base64
- [ ] Criar Base64StorageService implementando StorageService
- [ ] Criar HybridStorageService como delegador configurável
- [ ] Criar StorageConfiguration para configurar estratégia via application.yml
- [ ] Adicionar campos foto_base64/image_base64 (LONGTEXT) nas entidades User, MemberEntity, VisitorEntity, BookEntity, BannerImage
- [ ] Atualizar FileUploadController com parâmetros storageType e manterOriginal
- [ ] Atualizar FileController para servir imagens Base64 do banco
- [ ] Atualizar image-url-builder.ts no frontend para detectar e usar Base64