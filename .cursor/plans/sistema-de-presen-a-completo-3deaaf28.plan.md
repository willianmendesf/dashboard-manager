<!-- 3deaaf28-c60b-429d-8649-64702f9c35aa 2f98829b-9a75-4cc8-b48c-de94d2645fff -->
# Sistema de Gerenciamento de Presença - Especificação Completa

## 1. Arquitetura Geral e Regras Fundamentais

### 1.1 Estratégia de Armazenamento (Sparse Storage)

**Regra Principal:** Apenas registros de PRESENÇA são armazenados no banco de dados. A ausência é representada pela ausência de registro.

**Comportamento:**

- Quando um membro marca presença: INSERT na tabela `attendance`
- Quando um membro remove presença: DELETE do registro na tabela `attendance`
- Consulta de presença: LEFT JOIN entre Members e Attendance
- Se existe registro = `isPresent = true`
- Se não existe registro = `isPresent = false`

**Vantagens:**

- Economia de espaço (não armazena ausências)
- Performance (menos registros para processar)
- Simplicidade (lógica de toggle simples)

### 1.2 Convenções de Nomenclatura

**Backend (Java Spring Boot):**

- Classes, métodos, variáveis, URIs: **INGLÊS**
- Comentários em código: Português ou Inglês (opcional)
- Mensagens de erro/log: Português (PT-BR)

**Frontend (Angular):**

- Arquivos, classes, métodos, variáveis: **INGLÊS**
- Rotas: Português para públicas (`/lista-presenca`), Inglês para privadas (`/dashboard/attendance`)
- UI (labels, botões, títulos, mensagens): **PORTUGUÊS (PT-BR)**

**Exemplos:**

- Backend: `AttendanceEntity`, `toggleAttendance()`, `/api/v1/attendance/toggle`
- Frontend: `AttendanceService`, `toggleAttendance()`, rota `/lista-presenca`
- UI: "Lista de Presença", "Marcar Presença", "Tempo de Exibição: 10s"

### 1.3 Rotas e Acesso

**Rota Pública:**

- Path: `/lista-presenca`
- Acesso: Público (sem autenticação)
- Uso: Check-in de presença durante eventos

**Rota Privada:**

- Path: `/dashboard/attendance`
- Acesso: Requer autenticação (`AuthGuard`)
- Permissão: `READ_MEMBERS` (ou nova permissão `READ_ATTENDANCE`)
- Uso: Dashboard administrativo com analytics e relatórios

## Backend 

### 1. Entidades

#### 1.1 EventEntity.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/EventEntity.java`
- Campos: `id`, `date` (LocalDate), `startTime` (LocalTime), `endTime` (LocalTime), `name` (String), `type` (EventType enum)
- Tabela: `events`
- Default: `name = "Culto"`, `startTime = 09:30`, `endTime = 12:30`, `type = EventType.WORSHIP_SERVICE`
- Enum EventType: `WORSHIP_SERVICE`, `MEETING`, `OTHER`

#### 1.2 AttendanceEntity.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/AttendanceEntity.java`
- Campos: `id`, `member` (ManyToOne MemberEntity), `event` (ManyToOne EventEntity), `checkInTime` (LocalDateTime)
- Tabela: `attendance`
- Constraint: `@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "event_id"}))`

### 2. Repositórios

#### 2.1 EventRepository.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/repository/EventRepository.java`
- Métodos: `findByDate(LocalDate date)`, `findByDateBetween(LocalDate start, LocalDate end)`

#### 2.2 AttendanceRepository.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/repository/AttendanceRepository.java`
- Métodos:
- `existsByMemberIdAndEventId(Long memberId, Long eventId)`
- `deleteByMemberIdAndEventId(Long memberId, Long eventId)`
- `findByEventId(Long eventId)`
- Query customizada: `findMembersWithAttendanceByEventId(Long eventId)` - LEFT JOIN Members com Attendance

### 3. DTOs

#### 3.1 EventDTO.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/EventDTO.java`
- Campos: `id`, `date`, `startTime`, `endTime`, `name`, `type`

#### 3.2 AttendanceDTO.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/AttendanceDTO.java`
- Campos: `id`, `memberId`, `eventId`, `checkInTime`

#### 3.3 MemberAttendanceDTO.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/MemberAttendanceDTO.java`
- Campos: `member` (MemberDTO), `isPresent` (boolean)

#### 3.4 AttendanceStatsDTO.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/AttendanceStatsDTO.java`
- Campos: `dailyCounts` (List<DailyCountDTO>), `periodAverage` (Double)
- DailyCountDTO: `date` (LocalDate), `count` (Integer)

#### 3.5 AttendanceReportDTO.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/AttendanceReportDTO.java`
- Campos: `member` (MemberDTO), `totalEvents` (Integer), `presenceCount` (Integer), `absenceCount` (Integer), `presencePercentage` (Double)

### 4. Serviços

#### 4.1 EventService.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/service/EventService.java`
- Métodos:
- `getAll(LocalDate date)` - lista eventos, opcionalmente filtrado por data
- `create(EventDTO dto)` - cria evento com defaults se necessário
- `getById(Long id)`

#### 4.2 AttendanceService.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/service/AttendanceService.java`
- Métodos:
- `toggleAttendance(Long memberId, Long eventId)` - retorna boolean (novo estado)
- `getMembersByEvent(Long eventId)` - retorna List<MemberAttendanceDTO> com LEFT JOIN otimizado
- `getStats(LocalDate startDate, LocalDate endDate)` - retorna AttendanceStatsDTO
- `getReport(LocalDate startDate, LocalDate endDate, Integer minPresence, Integer maxPresence, Integer minAbsence, Integer maxAbsence)` - retorna List<AttendanceReportDTO>

### 5. Controller

#### 5.1 AttendanceController.java

- Localização: `code/backend/src/main/java/br/com/willianmendesf/system/controller/AttendanceController.java`
- Base path: `/api/v1/attendance`
- Endpoints:
- `GET /api/v1/events` - lista eventos (param opcional: `date`)
- `POST /api/v1/events` - cria evento
- `POST /api/v1/attendance/toggle` - body: `{memberId, eventId}`, retorna `{isPresent: boolean}`
- `GET /api/v1/attendance/event/{eventId}/members` - lista membros com status
- `GET /api/v1/attendance/stats` - params: `startDate`, `endDate`
- `GET /api/v1/attendance/report` - params: `startDate`, `endDate`, `minPresence`, `maxPresence`, `minAbsence`, `maxAbsence`

## Frontend (Angular)

### 6. Serviços Angular

#### 6.1 EventService

- Localização: `code/frontend/src/app/shared/service/event.service.ts`
- Métodos: `getAll(date?)`, `create(event)`

#### 6.2 AttendanceService

- Localização: `code/frontend/src/app/shared/service/attendance.service.ts`
- Métodos: `toggleAttendance(memberId, eventId)`, `getMembersByEvent(eventId)`, `getStats(startDate, endDate)`, `getReport(params)`

### 7. Tela Pública - Check-in de Presença

#### 7.1 AttendanceCheckinComponent

**Localização:** `code/frontend/src/app/pages/public/attendance-checkin/`

**Rota:** `/lista-presenca`

**Acesso:** Público (sem autenticação)

**Integração:** Adicionar botão/link na página `/landing` antes do link de login

#### 7.2 Estrutura Visual e Layout

**Layout Geral:**

- Tela full-screen, responsiva
- Fundo claro, design limpo e moderno
- Sem sidebar ou menu (tela pública isolada)

**Cabeçalho Fixo (Sticky Header):**

- **Data (Date Picker):**
- Label: "Data do Evento"
- Valor padrão: Data atual (hoje)
- Formato: DD/MM/YYYY
- Comportamento: Ao alterar, recarrega eventos da nova data
- Se não houver eventos na data, exibe mensagem: "Nenhum evento encontrado para esta data"

- **Seletor de Evento (Dropdown):**
- Label: "Evento"
- Carrega eventos da data selecionada
- Exibe: `{name} - {startTime} às {endTime}`
- Se não houver eventos: "Nenhum evento disponível"
- Valor padrão: Primeiro evento do dia (se existir)
- Comportamento: Ao selecionar, carrega membros do evento

- **Barra de Busca:**
- Placeholder: "Buscar por nome..."
- Filtro em tempo real (client-side)
- Busca no campo `nome` do membro
- Case-insensitive
- Limpa ao trocar de evento

- **Toggle Switch (Filtro):**
- Opções: "Adultos" | "Crianças"
- Padrão: "Adultos"
- Filtro baseado em `member.child`:
- "Adultos": `child === false`
- "Crianças": `child === true`
- Filtro aplicado localmente (client-side)
- Mantém estado ao trocar de evento

**Área de Conteúdo (Lista de Membros):**

- **Virtual Scrolling:**
- Usa `@angular/cdk/scrolling` com `cdk-virtual-scroll-viewport`
- Altura fixa: 70vh (viewport height)
- Item height: 80px (ajustável conforme necessário)
- Suporta 250+ membros sem lag

- **Paginação Client-Side (Opcional):**
- Se virtual scrolling não for suficiente
- 50 itens por página
- Controles: Anterior/Próximo, indicador de página

- **Card/Row de Membro:**
- **Avatar:**
- Se `fotoUrl` existe: exibe foto (circular, 50x50px)
- Se não: exibe iniciais do nome em círculo colorido
- Cores baseadas em hash do nome (consistente)

- **Nome:**
- Fonte: 16px, peso médio
- Texto completo do campo `nome`
- Destaque visual se `isPresent === true` (ex: ícone de check verde)

- **Checkbox:**
- Posição: Direita do card
- Estado: `checked = isPresent`
- Label: "Presente"
- Tamanho: Grande (fácil toque em mobile)
- Visual: Checkbox customizado (não nativo)

- **Estados Visuais:**
- **Presente:** Card com borda verde, ícone de check, checkbox marcado
- **Ausente:** Card padrão, checkbox desmarcado
- **Loading:** Skeleton loader durante carregamento
- **Erro:** Mensagem de erro abaixo do header

#### 7.3 Regras de Negócio e Comportamentos

**Carregamento Inicial:**

1. Ao abrir a tela:

- Data = hoje
- Busca eventos do dia atual
- Se houver eventos, seleciona o primeiro automaticamente
- Carrega todos os membros do evento selecionado
- Aplica filtro "Adultos" por padrão

**Seleção de Evento:**

- Ao selecionar evento diferente:
- Limpa busca (se houver)
- Mantém filtro Adultos/Crianças
- Carrega membros do novo evento
- Reseta scroll para topo

**Busca por Nome:**

- Filtro aplicado em tempo real
- Busca apenas no campo `nome`
- Não faz requisição ao servidor (client-side)
- Mantém estado de presença dos membros filtrados

**Toggle Presença (Checkbox):**

- **Comportamento Optimistic UI:**

1. Ao clicar no checkbox:

- Atualiza visualmente imediatamente (marca/desmarca)
- Exibe loading sutil no card (spinner pequeno)

2. Envia requisição com debounce de 300ms:

- Se usuário clicar múltiplas vezes, aguarda 300ms após último clique
- Payload: `{ memberId: number, eventId: number }`
- Endpoint: `POST /api/v1/attendance/toggle`

3. Se sucesso:

- Remove loading
- Atualiza `isPresent` com valor retornado
- Exibe toast de sucesso (opcional, discreto)

4. Se erro:

- Reverte estado visual (desmarca/marca)
- Remove loading
- Exibe mensagem de erro: "Erro ao atualizar presença. Tente novamente."
- Mantém estado anterior

**Validações:**

- Se evento não selecionado: Desabilita checkboxes, exibe mensagem
- Se não houver membros: Exibe "Nenhum membro encontrado"
- Se API falhar: Exibe erro, permite retry

**Performance:**

- Virtual scrolling para listas grandes (250+)
- Debounce em toggle para evitar spam
- Cache de membros por evento (não recarrega se já carregado)
- Lazy loading de imagens (avatar)

#### 7.4 Integração com Landing Page

**No LandingComponent:**

- Adicionar novo card/link antes do link "Fazer Login"
- Texto: "Lista de Presença"
- Ícone: Checkbox ou lista
- Rota: `/lista-presenca`
- Estilo: Consistente com outros cards da landing

#### 7.5 Casos de Uso

**Caso 1: Check-in durante culto**

1. Usuário acessa `/lista-presenca`
2. Data já está como hoje
3. Evento "Culto - 09:30 às 12:30" já selecionado
4. Lista de membros adultos carregada
5. Usuário clica em checkboxes para marcar presenças
6. Sistema atualiza em tempo real

**Caso 2: Verificar presenças de crianças**

1. Usuário está na tela
2. Altera toggle para "Crianças"
3. Lista filtra e mostra apenas membros com `child === true`
4. Usuário marca presenças das crianças

**Caso 3: Buscar membro específico**

1. Usuário digita nome na busca
2. Lista filtra em tempo real
3. Usuário encontra e marca presença
4. Limpa busca para ver todos novamente

**Caso 4: Evento de data diferente**

1. Usuário altera data para amanhã
2. Sistema busca eventos de amanhã
3. Seleciona primeiro evento disponível
4. Carrega membros desse evento

### 8. Tela Privada - Dashboard Admin

#### 8.1 AttendanceDashboardComponent

**Localização:** `code/frontend/src/app/pages/logged/attendance/`

**Rota:** `/dashboard/attendance`

**Acesso:** Requer autenticação (`AuthGuard`)

**Permissão:** `READ_MEMBERS` (ou nova `READ_ATTENDANCE`)

**Estrutura com Tabs/Abas:**

- **Aba 1: Presença** (padrão)
- **Aba 2: Visitantes** (migrado da tela antiga)

#### 8.2 Aba "Presença" - Estrutura

**Seção 1: Gráfico de Analytics (Topo da Página)**

- **Gráfico (Chart.js/ng2-charts):**
- Tipo: Line Chart (similar ao de visitantes)
- **Dataset 1 (Linha Principal):**
  - Label: "Presenças por Evento"
  - Dados: Quantidade de pessoas presentes em cada evento/culto
  - Cor: `#667eea` (azul)
  - Tipo: Line com pontos

- **Dataset 2 (Linha de Média):**
  - Label: "Média de Presença"
  - Dados: Média calculada do intervalo selecionado
  - Cor: `#10b981` (verde) ou `#f59e0b` (laranja)
  - Tipo: Line horizontal (constante) ou Line suave
  - Exibição: Sobreposta ao gráfico principal
  - Tooltip: Mostra valor da média

- **Controles do Gráfico:**
- **Intervalo Padrão:**
  - Valor padrão: 3 meses (últimos 3 meses)
  - Salvo no banco de dados (tabela `system_configurations` ou nova tabela)
  - Chave: `ATTENDANCE_DEFAULT_INTERVAL_MONTHS` (valor: `3`)

- **Seletor de Período:**
  - Opções: "Semanas", "Meses", "Anos"
  - Padrão: "Meses"
  - Salvo no banco: `ATTENDANCE_DEFAULT_PERIOD_TYPE` (valor: `MONTHS`)

- **Intervalo Customizado:**
  - Checkbox: "Usar intervalo customizado"
  - Quando marcado: Exibe campos de data início e fim
  - Quando desmarcado: Usa intervalo padrão (3 meses)
  - Botão "Salvar como Padrão": Salva intervalo atual no banco
  - Botão "Resetar": Volta para intervalo padrão salvo

- **Cálculo da Média:**
  - Fórmula: `Soma de todas as presenças / Número de eventos no intervalo`
  - Exibição: Linha horizontal no gráfico
  - Label: "Média: X pessoas/evento"

**Seção 2: Listagem de Presenças (Similar à Tela Pública)**

- **Filtros:**
- **Data:** Date Picker (padrão: hoje)
- **Evento:** Dropdown com eventos da data selecionada
- **Busca:** Campo de texto para buscar por nome (client-side)

- **Listagem de Membros:**
- **Fonte de Dados:** Mesma da tela pública (`GET /api/v1/members`)
- **Estrutura do Card/Row:**
  - Avatar/Foto (usando `buildProfileImageUrl()`)
  - Nome do membro
  - Botão WhatsApp (usando `utilsService.getWhatsAppLink()`)
  - Checkbox de presença (editável)
  - Indicador visual: Presente (verde) / Ausente (cinza)

- **Funcionalidades:**
  - **Visualizar:** Lista todos os membros cadastrados
  - **Editar Presença:**
  - Marcar checkbox: Adiciona presença (se não existir)
  - Desmarcar checkbox: Remove presença (se existir)
  - Toggle via API: `POST /api/v1/attendance/toggle`
  - Optimistic UI: Atualiza visualmente antes da confirmação
  - Debounce: 300ms para evitar spam

- **Estados:**
  - **Presente:** Card com borda verde, checkbox marcado
  - **Ausente:** Card padrão, checkbox desmarcado
  - **Loading:** Skeleton durante carregamento

**Seção 3: Relatórios (Opcional - Pode ser aba separada ou seção inferior)**

- **Filtros de Busca:**
- Input: "Buscar membros com [X] presenças"
- Input: "Buscar membros com [X] ausências"
- Date Range: Data início e data fim
- Botão: "Buscar"

- **Tabela de Resultados:**
- Colunas: Nome, Total de Eventos, Presenças, Ausências, % Presença
- Ordenação: Por % presença, nome, etc.
- Exportação: CSV/Excel (opcional)

#### 8.3 Aba "Visitantes" (Componente Existente - Zero Modificações)

**IMPORTANTE:** O componente de visitantes NÃO será modificado. Apenas será movido e usado como sub-aba.

- **Estratégia:**
  - Mover arquivos de `visitor-management/` para `attendance/visitor-tab/`
  - Importar `VisitorManagementComponent` na tela de presença
  - Usar como conteúdo da aba "Visitantes"
  - **ZERO modificações** no código do VisitorManagementComponent

- **Arquivos a Mover:**
  - `code/frontend/src/app/pages/logged/visitor-management/visitor-management.component.ts`
  - `code/frontend/src/app/pages/logged/visitor-management/visitor-management.component.html`
  - `code/frontend/src/app/pages/logged/visitor-management/visitor-management.component.scss`
  - `code/frontend/src/app/pages/logged/visitor-management/model/` (se existir)
  - **Nova localização:** `code/frontend/src/app/pages/logged/attendance/visitor-tab/`

- **Uso na Tela de Presença:**
  ```typescript
  // No AttendanceDashboardComponent
  import { VisitorManagementComponent } from './visitor-tab/visitor-management.component';
  
  // No template, usar como conteúdo da aba:
  <div *ngIf="activeTab === 'visitors'">
    <app-visitor-management></app-visitor-management>
  </div>
  ```

- **Rota:**
  - Rota antiga `/visitor-management` → Redirect para `/dashboard/attendance?tab=visitors`
  - Ou manter rota antiga funcionando (opcional)

- **Menu:**
  - Remover item "Visitantes" do SidebarComponent
  - Manter apenas item "Presença" que abre a tela com abas

#### 8.4 Integração com Menu

**SidebarComponent:**

- **Remover:** Item "Visitantes" do menu
- **Adicionar:** Item "Presença"
- Rota: `/dashboard/attendance`
- Ícone: Checkbox ou lista de presença
- Permissão: `READ_MEMBERS` (ou `READ_ATTENDANCE`)
- Label: "Presença"

**app.routes.ts:**

- **Remover:** Rota `/visitor-management` (ou manter como redirect)
- **Adicionar:** Rota `/dashboard/attendance` com `AuthGuard`

### 9. Integrações

#### 9.1 LandingComponent

- Adicionar link para `/lista-presenca` antes do link de login

#### 9.2 SidebarComponent

- Adicionar item "Presença" com ícone apropriado, rota `/dashboard/attendance`, permission `READ_MEMBERS` (ou criar nova)

#### 9.3 app.routes.ts

- Adicionar rota pública: `{ path: 'lista-presenca', component: AttendanceCheckinComponent }`
- Adicionar rota privada: `{ path: 'dashboard/attendance', component: AttendanceDashboardComponent, canActivate: [AuthGuard] }`

### 10. Componentes e Serviços Reutilizáveis (JÁ EXISTENTES - REUTILIZAR)

#### 10.1 Serviços e Utilitários Existentes

**IMPORTANTE: NÃO CRIAR NOVOS SERVIÇOS. REUTILIZAR OS EXISTENTES:**

- **buildProfileImageUrl()** 
- Localização: `code/frontend/src/app/shared/utils/image-url-builder.ts`
- Função: Constrói URL de imagem de membro a partir de `fotoUrl`
- Uso: `import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder'`
- Exemplo: `buildProfileImageUrl(member.fotoUrl)` retorna URL completa ou `'./img/avatar-default.png'`

- **UtilsService.getWhatsAppLink()**
- Localização: `code/frontend/src/app/shared/services/utils.service.ts`
- Método: Gera link do WhatsApp a partir de número de telefone
- Uso: `utilsService.getWhatsAppLink(member.celular || member.telefone)`
- Retorna: `string | null` (null se número inválido)

- **getWhatsAppIcon()**
- Padrão usado em várias telas (MemberManagementComponent, LoansComponent, etc.)
- Usa `MessageIcons.whatsapp()` do `shared/lib/utils/icons`
- Retorna `SafeHtml` para uso em `[innerHTML]`

- **MemberService / ApiService**
- Endpoint existente: `GET /api/v1/members`
- Usar `ApiService.get('members')` para buscar todos os membros
- Mesmo endpoint usado em MemberManagementComponent

#### 10.2 Componentes Existentes (Verificar se podem ser reutilizados)

- **DataTableComponent**: Já existe e pode ser usado na tela privada
- **ModalComponent**: Já existe para modais
- **PageTitleComponent**: Já existe para títulos de página

#### 10.3 Componentes a Criar (APENAS SE NÃO EXISTIR)

- **DateRangePickerComponent** (se não existir)
- Localização: `code/frontend/src/app/shared/modules/date-range-picker/`
- Presets: "Últimos 3 Meses", "Último Mês", "Personalizado"
- Usar apenas na tela privada (dashboard admin)

- **AvatarComponent** (se não existir)
- Localização: `code/frontend/src/app/shared/modules/avatar/`
- Exibe foto ou iniciais do nome
- Se não existir, implementar inline na tela pública (não criar componente separado se uso for único)

## Ordem de Implementação

1. Backend: Entidades → Repositórios → DTOs → Serviços → Controller
2. Frontend: Serviços → Tela Pública → Tela Privada → Integrações
3. Testes: Validar sparse storage, virtual scrolling, charts, debounce

## Observações Técnicas

- Virtual Scrolling: Usar `@angular/cdk/scrolling` com `cdk-virtual-scroll-viewport`
- Charts: Usar `ng2-charts` (já instalado) com Chart.js
- Debounce: Usar `rxjs` `debounceTime(300)`
- Optimistic UI: Atualizar estado local antes da chamada, reverter em catch
- Performance: Query otimizada com LEFT JOIN para evitar N+1

### To-dos

- [ ] Criar EventEntity e AttendanceEntity com relacionamentos e constraints
- [ ] Criar EventRepository e AttendanceRepository com queries customizadas otimizadas
- [ ] Criar DTOs: EventDTO, AttendanceDTO, MemberAttendanceDTO, AttendanceStatsDTO, AttendanceReportDTO
- [ ] Criar EventService e AttendanceService com toda lógica de negócio
- [ ] Criar AttendanceController com todos os endpoints REST
- [ ] Criar EventService e AttendanceService no Angular usando ApiService
- [ ] Implementar AttendanceCheckinComponent com virtual scrolling, debounce e optimistic UI
- [ ] Implementar AttendanceDashboardComponent com charts, tabelas e relatórios
- [ ] Adicionar rotas, links no LandingComponent e item no SidebarComponent
- [ ] Criar componentes reutilizáveis se necessário (DateRangePicker, Avatar)