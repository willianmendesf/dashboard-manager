<!-- 3deaaf28-c60b-429d-8649-64702f9c35aa 2f98829b-9a75-4cc8-b48c-de94d2645fff -->
# Sistema de Gerenciamento de Presença - Plano de Implementação

## Arquitetura Geral

**Estratégia de Dados:** Sparse Storage - apenas registros de presença são armazenados. Ausência = ausência de registro.

**Convenções:**

- Código (classes, métodos, variáveis, URIs): INGLÊS
- UI (labels, botões, títulos): PORTUGUÊS (PT-BR)
- Rotas: `/dashboard/attendance` (privada), `/lista-presenca` (pública)

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

### 7. Tela Pública - Check-in

#### 7.1 AttendanceCheckinComponent

- Localização: `code/frontend/src/app/pages/public/attendance-checkin/`
- Rota: `/lista-presenca`
- Estrutura:
- **Sticky Header:**
- Date Picker (default: hoje)
- Event Selector (dropdown de eventos da data)
- Search Bar (filtro por nome)
- Toggle Switch: "Adultos" | "Crianças" (filtro local)
- **Lista:**
- Virtual Scrolling (CDK ScrollingModule) + Paginação client-side
- Row: Avatar (foto ou iniciais), Nome, Checkbox
- **Lógica:**
- Carrega todos membros com `isPresent` para evento selecionado
- Checkbox: debounce 300ms, optimistic UI update
- Reverter se API falhar

### 8. Tela Privada - Dashboard Admin

#### 8.1 AttendanceDashboardComponent

- Localização: `code/frontend/src/app/pages/logged/attendance/`
- Rota: `/dashboard/attendance`
- Estrutura:
- **Seção 1: Analytics**
- Date Range Picker: "Últimos 3 Meses" (default) ou "Personalizado"
- Chart (Chart.js/ng2-charts):
- Series A (Bars): Contagem de presença por evento
- Series B (Line): Média calculada do período (sobreposta)
- **Seção 2: Gerenciamento**
- Date/Event Selector
- Tabela (DataTableComponent): Lista membros presente/ausente
- Ação: Toggle presença (modo correção)
- **Seção 3: Relatórios**
- Inputs: "Buscar membros com [X] [Presenças/Ausências] entre [Data] e [Data]"
- Tabela de resultados

### 9. Integrações

#### 9.1 LandingComponent

- Adicionar link para `/lista-presenca` antes do link de login

#### 9.2 SidebarComponent

- Adicionar item "Presença" com ícone apropriado, rota `/dashboard/attendance`, permission `READ_MEMBERS` (ou criar nova)

#### 9.3 app.routes.ts

- Adicionar rota pública: `{ path: 'lista-presenca', component: AttendanceCheckinComponent }`
- Adicionar rota privada: `{ path: 'dashboard/attendance', component: AttendanceDashboardComponent, canActivate: [AuthGuard] }`

### 10. Componentes Reutilizáveis (se necessário)

#### 10.1 DateRangePickerComponent (se não existir)

- Localização: `code/frontend/src/app/shared/modules/date-range-picker/`
- Presets: "Últimos 3 Meses", "Último Mês", "Personalizado"

#### 10.2 AvatarComponent (se não existir)

- Localização: `code/frontend/src/app/shared/modules/avatar/`
- Exibe foto ou iniciais do nome

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