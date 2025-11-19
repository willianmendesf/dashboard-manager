<!-- 21f9382c-afc3-41cd-b9f8-0611c4c43252 efacc017-cb6c-4afb-9f9b-aa9a92295206 -->
# Sistema de Banners e Transmissão (Digital Signage)

## Estrutura do Módulo

### Backend (Java Spring Boot)

#### 1. Enum e Entidades

- **BannerType.java** (`model/enums/`): Enum com valores `IMAGE_SLIDE`, `VIDEO_YOUTUBE`
- **BannerConfig.java** (`model/entity/`): Entidade para configuração de horários
  - Campos: id, type (BannerType), startTime (LocalTime), endTime (LocalTime), youtubeUrl (String nullable), isActive (Boolean), order (Integer), muted (Boolean, default: false - áudio ativo por padrão)
- **BannerImage.java** (`model/entity/`): Entidade para imagens do slide
  - Campos: id, title (String), imageUrl (String), active (Boolean), displayOrder (Integer)

#### 2. Repositories

- **BannerConfigRepository.java**: JpaRepository com query para buscar configuração ativa por horário
- **BannerImageRepository.java**: JpaRepository com query para buscar imagens ativas ordenadas

#### 3. DTOs

- **BannerConfigDTO.java**: DTO para CRUD de configurações (inclui campo `muted`)
- **BannerImageDTO.java**: DTO para imagens
- **BannerCurrentStateDTO.java**: DTO de resposta do endpoint público com `mode`, `videoUrl`, `muted`, `images[]`

#### 4. Services

- **BannerService.java**: Lógica de negócio
  - Método `getCurrentState()`: Verifica hora atual, busca BannerConfig ativa, retorna estado (SLIDE ou VIDEO)
  - CRUD de configurações e imagens
  - **Método `deleteImage(Long id)`**: 
    - Busca BannerImage pelo ID
    - Deleta o arquivo físico usando `StorageService.deleteFile(imageUrl)` antes de deletar do banco
    - Usar `@Transactional` para garantir atomicidade
    - Tratar exceções caso arquivo não exista (log e continuar)
  - Validação de horários sobrepostos (opcional)

#### 5. Controllers

- **BannerConfigController.java** (`/api/v1/banners/configs`): CRUD protegido com `@PreAuthorize`
- **BannerImageController.java** (`/api/v1/banners/images`): Upload, listagem e exclusão (DELETE chama service que remove arquivo)
- **PublicBannerController.java** (`/api/v1/public/banners/current-state`): Endpoint público sem autenticação

### Frontend (Angular 17+)

#### 1. Service

- **banner.service.ts** (`shared/service/`): Service com métodos para API
  - `getCurrentState()`: Observable<BannerCurrentStateDTO>
  - CRUD de configurações e imagens
  - Upload de imagens

#### 2. Componente Público (TV Display)

- **tv-display.component.ts** (`pages/public/tv-display/`)
  - Full screen (100vw, 100vh), fundo preto
  - Polling a cada 5-10s para verificar estado atual (detecção rápida de mudanças)
  - Sistema de detecção de mudança de estado: Comparar estado anterior com atual
  - Transições suaves sem refresh:
    - Fade out/in (opacity transitions) ao mudar entre SLIDE e VIDEO
    - Evitar reload do iframe YouTube quando possível (reutilizar se mesma URL)
    - Animações CSS com `transition: opacity 0.5s ease-in-out`
  - Modo Slide: Carrossel automático com transições CSS, indicadores, barra de progresso
  - Modo Vídeo: iframe YouTube em tela cheia
    - Usar parâmetro `mute=0` se `muted: false` (áudio ativo)
    - Usar parâmetro `mute=1` se `muted: true` (áudio mudo)
    - URL: `https://www.youtube.com/embed/{id}?autoplay=1&controls=0&mute={0|1}&loop=1&playlist={id}`
  - Função utilitária para extrair ID do YouTube de URLs
  - Estado interno: Armazenar `currentMode`, `currentVideoUrl`, `currentImages[]` para comparação

#### 3. Componente Admin

- **banner-management.component.ts** (`pages/logged/banner-management/`)
  - Seção de upload de imagens (drag & drop)
  - Lista de imagens com miniatura e exclusão
  - Grade de programação (tabela de configurações)
  - Formulário para adicionar/editar horários
    - Campo checkbox "Iniciar com áudio mudo" (visível apenas quando Tipo = Vídeo)
    - Default: desmarcado (áudio ativo)
  - Validação de horários sobrepostos
  - Configuração de tempo de transição do slide

#### 4. Rotas

- Adicionar `/mural` em `app.routes.ts` (pública, sem AuthGuard)
- Adicionar `/banner-management` em `app.routes.ts` (protegida com AuthGuard e PermissionGuard)

## Detalhes de Implementação

### Backend - Endpoint Público

```java
GET /api/v1/public/banners/current-state
Response: {
  "mode": "SLIDE" | "VIDEO",
  "videoUrl": "https://youtube.com/...",
  "muted": false,
  "images": [
    { "id": 1, "title": "...", "imageUrl": "..." },
    ...
  ]
}
```

Lógica: Verifica `LocalTime.now()`, busca `BannerConfig` ativa que cubra o horário. Se não encontrar, retorna modo SLIDE com imagens ativas.

### Backend - Deletar Imagem

```java
@Transactional
public void deleteImage(Long id) {
    BannerImage image = bannerImageRepository.findById(id)
        .orElseThrow(() -> new BannerException("Imagem não encontrada"));
    
    // Deletar arquivo físico primeiro
    if (image.getImageUrl() != null && !image.getImageUrl().isEmpty()) {
        try {
            storageService.deleteFile(image.getImageUrl());
            log.info("Arquivo deletado: {}", image.getImageUrl());
        } catch (Exception e) {
            log.warn("Erro ao deletar arquivo (continuando): {}", e.getMessage());
            // Continua mesmo se arquivo não existir
        }
    }
    
    // Deletar do banco
    bannerImageRepository.delete(image);
}
```

### Frontend - Tela TV

- Polling com `interval(5000)` ou `interval(10000)` do RxJS (5-10 segundos)
- Detecção de mudança:
  - Comparar `previousState.mode !== currentState.mode` ou `previousState.videoUrl !== currentState.videoUrl`
  - Se mudou, acionar transição suave (fade out → trocar conteúdo → fade in)
- Transições sem refresh:
  - Usar `opacity: 0` → `opacity: 1` com CSS transitions (0.5s)
  - Para vídeo: Se URL mudou, criar novo iframe; se mesma URL, manter iframe existente
  - Para slides: Se lista de imagens mudou, atualizar carrossel suavemente
- Carrossel: CSS transitions com `setInterval` para troca automática entre imagens
- YouTube: Extrair ID e usar embed URL com parâmetro `mute` baseado em `muted` do estado
- Gerenciamento de estado:
  - Variável `previousState` para comparar
  - Flag `isTransitioning` para evitar múltiplas transições simultâneas
  - Método `handleStateChange(newState)` que verifica mudanças e aplica transições

### Frontend - Admin

- Upload usando `FormData` e `StorageService` do backend
- Time picker nativo HTML5 ou biblioteca Angular
- Checkbox "Iniciar com áudio mudo" no formulário de configuração (apenas para tipo VIDEO)
- Validação de sobreposição: Verificar se novo horário conflita com existentes antes de salvar
- Ao deletar imagem: Confirmar ação e chamar API que remove arquivo físico automaticamente

## Validação de Nomes

✅ **Validação concluída**: Todos os nomes propostos foram verificados e estão disponíveis:

- Nenhuma classe Java com "Banner" encontrada
- Nenhum componente Angular com "banner" ou "tv-display" encontrado
- Nenhum service Angular com "banner" encontrado
- Nenhuma rota "/tv" ou "/banner-management" existente
- Nenhum endpoint "/banners" na API existente
- Nenhum repository ou service Java com "Banner" encontrado

## Arquivos a Criar/Modificar

### Backend

- `model/enums/BannerType.java` ✅
- `model/entity/BannerConfig.java` ✅ (com campo `muted`)
- `model/entity/BannerImage.java` ✅
- `model/dto/BannerConfigDTO.java` ✅ (com campo `muted`)
- `model/dto/BannerImageDTO.java` ✅
- `model/dto/BannerCurrentStateDTO.java` ✅ (com campo `muted`)
- `repository/BannerConfigRepository.java` ✅
- `repository/BannerImageRepository.java` ✅
- `service/BannerService.java` ✅ (com método deleteImage que remove arquivo físico)
- `controller/BannerConfigController.java` ✅
- `controller/BannerImageController.java` ✅
- `controller/PublicBannerController.java` ✅

### Frontend

- `shared/service/banner.service.ts` ✅
- `pages/public/tv-display/tv-display.component.ts` ✅ (com polling rápido e transições)
- `pages/public/tv-display/tv-display.component.html` ✅
- `pages/public/tv-display/tv-display.component.scss` ✅
- `pages/logged/banner-management/banner-management.component.ts` ✅ (com checkbox muted)
- `pages/logged/banner-management/banner-management.component.html` ✅
- `pages/logged/banner-management/banner-management.component.scss` ✅
- Modificar: `app.routes.ts`, `app.ts` (adicionar `/mural` nas rotas públicas) ✅

### To-dos

- [ ] Criar enum BannerType e entidades BannerConfig e BannerImage com JPA annotations
- [ ] Criar repositories com queries customizadas (buscar config ativa por horário, imagens ativas ordenadas)
- [ ] Criar DTOs (BannerConfigDTO, BannerImageDTO, BannerCurrentStateDTO)
- [ ] Implementar BannerService com lógica de getCurrentState() e CRUD completo
- [ ] Criar controllers (BannerConfigController, BannerImageController, PublicBannerController) com endpoints protegidos e públicos
- [ ] Criar banner.service.ts com métodos para API e interfaces TypeScript
- [ ] Implementar componente tv-display com polling, carrossel de imagens e player YouTube
- [ ] Criar componente banner-management com upload, listagem e grade de programação
- [ ] Adicionar rotas /tv (pública) e /banner-management (protegida) no app.routes.ts e app.ts