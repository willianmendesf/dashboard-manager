<!-- a6847d03-49d4-4d84-b5dd-620b9abef215 4bc4cded-ab69-44ec-a6a7-bfcf127473a7 -->
# Mapeamento Completo do Sistema - Grupos de Funcionalidades para Regras de Acesso

## Resumo Executivo

Este documento apresenta um mapeamento completo de todas as funcionalidades do sistema (backend e frontend), identificando padrões existentes e sugerindo grupos lógicos para implementação de um sistema granular de controle de acesso. O sistema atualmente possui 31 controllers no backend e 13 páginas principais no frontend, com padrões inconsistentes de permissões.

## 1. Padrões Identificados no Sistema

### 1.1 Padrão de Permissões Atual

O sistema utiliza `@PreAuthorize("hasAuthority('PERMISSION_NAME')")` no backend com permissões genéricas:

- **READ_**: Leitura (listagem, visualização)
- **WRITE_**: Escrita (criação, edição, upload)
- **DELETE_**: Exclusão

### 1.2 Controllers Sem Proteção de Permissões

Alguns controllers não possuem `@PreAuthorize`:

- `AppointmentsController` - Todos endpoints públicos
- `WhatsappMessageController` - Sem permissões
- `WhatsappAuthController` - Sem permissões  
- `PublicBannerController` - Público por design
- `PublicMemberController` - Público por design
- `PublicLoanController` - Público por design
- `PublicVisitorController` - Público por design

### 1.3 Endpoints Públicos Identificados

Conforme `SecurityConfig.java`, os seguintes endpoints são públicos:

- `/auth/**` - Autenticação
- `/emergency/**` - Emergências
- `/files/**` - Arquivos públicos
- `/usuarios/registro` - Registro público
- `/enrollments/request` - Solicitação de participação
- `/enrollments/member/**` - Consulta de enrollments do membro
- `/enrollments/can-request/**` - Verificação de possibilidade de solicitar
- `/events` (GET) - Listar eventos
- `/attendance/toggle` - Alternar presença
- `/attendance/event/{id}/members` - Membros por evento
- `/banners/channels/active` - Canais ativos de banner

## 2. Mapeamento Completo do Backend

### 2.1 Módulo: GESTÃO DE MEMBROS

**Controller:** `MemberController` (`/members`)

- `GET /` → `READ_MEMBERS` - Listar todos os membros
- `GET /{id}` → `READ_MEMBERS` - Buscar membro por ID
- `GET /telefone/{telefone}/spouse` → `READ_MEMBERS` - Buscar cônjuge
- `GET /telefone/{telefone}/parent` → `READ_MEMBERS` - Buscar responsável
- `GET /telefone/{telefone}/children` → `READ_MEMBERS` - Buscar filhos
- `POST /` → `WRITE_MEMBERS` - Criar membro
- `PATCH /{id}` → `WRITE_MEMBERS` - Atualizar membro
- `DELETE /{id}` → `DELETE_MEMBERS` - Excluir membro
- `POST /{id}/upload-foto` → `WRITE_MEMBERS` - Upload de foto
- `POST /import` → `WRITE_MEMBERS` - Importar membros (Excel)
- `GET /import/template` → `WRITE_MEMBERS` - Baixar template de importação

**Operações sugeridas:**

- `ACCESS_SCREEN_MEMBER_MANAGEMENT` - Acessar tela de gestão
- `READ_MEMBERS` - Visualizar membros
- `CREATE_MEMBERS` - Criar novos membros
- `UPDATE_MEMBERS` - Editar membros existentes
- `DELETE_MEMBERS` - Excluir membros
- `UPLOAD_MEMBER_PHOTO` - Fazer upload de fotos
- `IMPORT_MEMBERS` - Importar via Excel
- `EXPORT_MEMBERS` - Exportar dados (não implementado)

### 2.2 Módulo: GRUPOS E VOLUNTARIADO

**Controller:** `GroupController` (`/groups`)

- `GET /` → `READ_MEMBERS` - Listar grupos
- `GET /{id}` → `READ_MEMBERS` - Buscar grupo por ID
- `POST /` → `WRITE_MEMBERS` - Criar grupo
- `PUT /{id}` → `WRITE_MEMBERS` - Atualizar grupo
- `DELETE /{id}` → `WRITE_MEMBERS` - Excluir grupo

**Controller:** `GroupEnrollmentController` (`/enrollments`)

- `POST /request` → PÚBLICO - Solicitar participação
- `POST /{id}/approve` → `WRITE_MEMBERS` - Aprovar solicitação
- `POST /{id}/reject` → `WRITE_MEMBERS` - Rejeitar solicitação
- `DELETE /{id}` → `WRITE_MEMBERS` - Remover participação
- `GET /pending` → `READ_MEMBERS` - Listar pendentes
- `GET /history` → `READ_MEMBERS` - Histórico de participações
- `GET /member/{memberId}` → PÚBLICO - Enrollments do membro
- `GET /group/{groupId}` → `READ_MEMBERS` - Membros do grupo
- `GET /can-request/{memberId}/{groupId}` → PÚBLICO - Verificar possibilidade
- `POST /direct-approval` → `WRITE_MEMBERS` - Aprovação direta

**Operações sugeridas:**

- `ACCESS_SCREEN_VOLUNTEERING` - Acessar tela de voluntariado
- `READ_GROUPS` - Visualizar grupos
- `CREATE_GROUPS` - Criar grupos
- `UPDATE_GROUPS` - Editar grupos
- `DELETE_GROUPS` - Excluir grupos
- `APPROVE_ENROLLMENTS` - Aprovar participações
- `REJECT_ENROLLMENTS` - Rejeitar participações
- `MANAGE_GROUP_MEMBERS` - Gerenciar membros do grupo

### 2.3 Módulo: PRESENÇA E EVENTOS

**Controller:** `AttendanceController` (`/attendance`)

- `GET /events` → PÚBLICO - Listar eventos
- `POST /events` → `WRITE_MEMBERS` - Criar evento
- `POST /attendance/toggle` → PÚBLICO - Alternar presença
- `GET /attendance/event/{eventId}/members` → PÚBLICO - Membros por evento
- `GET /attendance/stats` → `READ_MEMBERS` - Estatísticas de presença
- `GET /attendance/report` → `READ_MEMBERS` - Relatório de presença

**Operações sugeridas:**

- `ACCESS_SCREEN_ATTENDANCE` - Acessar dashboard de presença
- `READ_EVENTS` - Visualizar eventos
- `CREATE_EVENTS` - Criar eventos
- `UPDATE_EVENTS` - Editar eventos
- `DELETE_EVENTS` - Excluir eventos (não implementado)
- `MANAGE_ATTENDANCE` - Gerenciar presenças
- `VIEW_ATTENDANCE_STATS` - Ver estatísticas
- `VIEW_ATTENDANCE_REPORTS` - Ver relatórios
- `TOGGLE_PUBLIC_ATTENDANCE` - Alternar presença pública

### 2.4 Módulo: EMPRÉSTIMOS E BIBLIOTECA

**Controller:** `LoanController` (`/loans`)

- `GET /` → `READ_MEMBERS` - Listar empréstimos
- `GET /{id}` → `READ_MEMBERS` - Buscar empréstimo por ID
- `PATCH /{id}/return` → `WRITE_MEMBERS` - Marcar como devolvido

**Controller:** `BookController` (`/books`)

- `GET /` → `READ_MEMBERS` - Listar livros
- `GET /{id}` → `READ_MEMBERS` - Buscar livro por ID
- `POST /` → `WRITE_MEMBERS` - Criar livro
- `PUT /{id}` → `WRITE_MEMBERS` - Atualizar livro
- `DELETE /{id}` → `WRITE_MEMBERS` - Excluir livro
- `POST /{id}/upload-foto` → `WRITE_MEMBERS` - Upload de foto

**Operações sugeridas:**

- `ACCESS_SCREEN_LOANS` - Acessar tela de empréstimos
- `READ_LOANS` - Visualizar empréstimos
- `CREATE_LOANS` - Criar empréstimos (não implementado)
- `UPDATE_LOANS` - Atualizar empréstimos
- `RETURN_LOANS` - Registrar devolução
- `READ_BOOKS` - Visualizar livros
- `CREATE_BOOKS` - Cadastrar livros
- `UPDATE_BOOKS` - Editar livros
- `DELETE_BOOKS` - Excluir livros
- `UPLOAD_BOOK_COVER` - Upload de capa

### 2.5 Módulo: VISITANTES

**Controller:** `VisitorController` (`/visitors`)

- `GET /` → `READ_VISITORS` - Listar visitantes
- `GET /{id}` → `READ_VISITORS` - Buscar visitante por ID
- `PUT /{id}` → `WRITE_VISITORS` - Atualizar visitante
- `DELETE /{id}` → `DELETE_VISITORS` - Excluir visitante
- `GET /stats` → `READ_VISITORS` - Estatísticas
- `GET /stats/sundays` → `READ_VISITORS` - Estatísticas de domingos
- `POST /{id}/upload-foto` → `WRITE_VISITORS` - Upload de foto
- `GET /import/template` → `WRITE_VISITORS` - Template de importação
- `POST /import` → `WRITE_VISITORS` - Importar visitantes

**Operações sugeridas:**

- `ACCESS_SCREEN_VISITOR_MANAGEMENT` - Acessar tela de gestão
- `READ_VISITORS` - Visualizar visitantes
- `CREATE_VISITORS` - Cadastrar visitantes (não implementado no admin)
- `UPDATE_VISITORS` - Editar visitantes
- `DELETE_VISITORS` - Excluir visitantes
- `VIEW_VISITOR_STATS` - Ver estatísticas
- `IMPORT_VISITORS` - Importar via Excel

### 2.6 Módulo: USUÁRIOS E PERFIS

**Controller:** `UserManagementController` (`/users`)

- `GET /` → `READ_USERS` - Listar usuários
- `GET /{id}` → `READ_USERS` - Buscar usuário por ID
- `POST /` → `WRITE_USERS` - Criar usuário
- `PUT /{id}` → `WRITE_USERS` - Atualizar usuário
- `DELETE /{id}` → `DELETE_USERS` - Excluir usuário
- `POST /{id}/upload-foto` → `WRITE_USERS` - Upload de foto

**Controller:** `ProfileController` (`/profiles`)

- `GET /` → `READ_PROFILES` - Listar perfis
- `GET /{id}` → `READ_PROFILES` - Buscar perfil por ID
- `POST /` → `WRITE_PROFILES` - Criar/atualizar perfil
- `PUT /{id}` → `WRITE_PROFILES` - Atualizar perfil
- `DELETE /{id}` → `DELETE_PROFILES` - Excluir perfil

**Controller:** `PermissionController` (`/permissions`)

- `GET /` → `READ_PROFILES` - Listar permissões

**Operações sugeridas:**

- `ACCESS_SCREEN_USER_MANAGEMENT` - Acessar gestão de usuários
- `READ_USERS` - Visualizar usuários
- `CREATE_USERS` - Criar usuários
- `UPDATE_USERS` - Editar usuários
- `DELETE_USERS` - Excluir usuários
- `MANAGE_USER_PHOTOS` - Gerenciar fotos
- `ACCESS_SCREEN_PROFILES` - Acessar gestão de perfis
- `READ_PROFILES` - Visualizar perfis
- `CREATE_PROFILES` - Criar perfis
- `UPDATE_PROFILES` - Editar perfis
- `DELETE_PROFILES` - Excluir perfis
- `ASSIGN_PERMISSIONS` - Atribuir permissões

### 2.7 Módulo: BANNERS E MURAL DIGITAL

**Controller:** `BannerImageController` (`/banners/images`)

- `GET /` → `READ_MEMBERS` - Listar imagens
- `GET /{id}` → `READ_MEMBERS` - Buscar imagem por ID
- `POST /` → `WRITE_MEMBERS` - Upload de imagem
- `PUT /{id}` → `WRITE_MEMBERS` - Atualizar imagem
- `DELETE /{id}` → `WRITE_MEMBERS` - Excluir imagem

**Controller:** `BannerChannelController` (`/banners/channels`)

- `GET /` → `READ_MEMBERS` - Listar canais
- `GET /active` → PÚBLICO - Canais ativos
- `GET /{id}` → `READ_MEMBERS` - Buscar canal por ID
- `POST /` → `WRITE_MEMBERS` - Criar canal
- `PUT /{id}` → `WRITE_MEMBERS` - Atualizar canal
- `PATCH /{id}/toggle-active` → `WRITE_MEMBERS` - Ativar/desativar
- `DELETE /{id}` → `WRITE_MEMBERS` - Excluir canal

**Controller:** `BannerConfigController` (`/banners/config`)

- `GET /` → `READ_MEMBERS` - Configurações
- `GET /{id}` → `READ_MEMBERS` - Buscar configuração
- `POST /` → `WRITE_MEMBERS` - Criar configuração
- `PUT /{id}` → `WRITE_MEMBERS` - Atualizar configuração
- `PATCH /{id}/toggle-active` → `WRITE_MEMBERS` - Ativar/desativar

**Operações sugeridas:**

- `ACCESS_SCREEN_BANNER_MANAGEMENT` - Acessar gestão de banners
- `READ_BANNERS` - Visualizar banners
- `CREATE_BANNERS` - Criar banners
- `UPDATE_BANNERS` - Editar banners
- `DELETE_BANNERS` - Excluir banners
- `MANAGE_BANNER_CHANNELS` - Gerenciar canais
- `CONFIGURE_BANNER_DISPLAY` - Configurar exibição
- `VIEW_PUBLIC_MURAL` - Visualizar mural público

### 2.8 Módulo: CONFIGURAÇÕES DO SISTEMA

**Controller:** `ConfigurationsController` (`/configurations`)

- `GET /` → `READ_CONFIG` - Listar configurações
- `GET /{key}` → PÚBLICO (sem PreAuthorize) - Buscar por chave
- `PUT /` → `WRITE_CONFIG` - Atualizar múltiplas
- `PUT /{key}` → `WRITE_CONFIG` - Atualizar específica
- `POST /` → `WRITE_CONFIG` - Criar configuração

**Operações sugeridas:**

- `ACCESS_SCREEN_SETTINGS` - Acessar configurações
- `READ_CONFIG` - Visualizar configurações
- `UPDATE_CONFIG` - Editar configurações
- `MANAGE_SYSTEM_SETTINGS` - Gerenciar configurações do sistema

### 2.9 Módulo: AGENDAMENTOS (Sem Permissões)

**Controller:** `AppointmentsController` (`/appointments`)

- `GET /` → SEM PERMISSÃO - Listar agendamentos
- `GET /id/{id}` → SEM PERMISSÃO - Buscar por ID
- `GET /{name}` → SEM PERMISSÃO - Buscar por nome
- `POST /` → SEM PERMISSÃO - Criar agendamento
- `POST /{id}` → SEM PERMISSÃO - Atualizar agendamento
- `DELETE /{id}` → SEM PERMISSÃO - Excluir agendamento

**Operações sugeridas:**

- `ACCESS_SCREEN_APPOINTMENTS` - Acessar tela
- `READ_APPOINTMENTS` - Visualizar agendamentos
- `CREATE_APPOINTMENTS` - Criar agendamentos
- `UPDATE_APPOINTMENTS` - Editar agendamentos
- `DELETE_APPOINTMENTS` - Excluir agendamentos
- `EXECUTE_APPOINTMENTS` - Executar agendamentos
- `VIEW_APPOINTMENT_LOGS` - Ver logs de execução

### 2.10 Módulo: WHATSAPP (Sem Permissões)

**Controller:** `WhatsappMessageController` (`/whatsapp`)

- `GET /contacts` → SEM PERMISSÃO - Listar contatos
- `GET /groups` → SEM PERMISSÃO - Listar grupos
- `GET /history/{jid}` → SEM PERMISSÃO - Histórico
- `POST /` → SEM PERMISSÃO - Enviar mensagem

**Controller:** `WhatsappAuthController` (`/whatsapp/auth`)

- Endpoints sem permissões

**Operações sugeridas:**

- `ACCESS_SCREEN_WHATSAPP` - Acessar tela
- `SEND_WHATSAPP_MESSAGES` - Enviar mensagens
- `READ_WHATSAPP_CONTACTS` - Ver contatos
- `READ_WHATSAPP_GROUPS` - Ver grupos
- `VIEW_WHATSAPP_HISTORY` - Ver histórico
- `MANAGE_WHATSAPP_CONNECTION` - Gerenciar conexão

### 2.11 Módulo: MENSAGENS

**Controller:** Não identificado (provavelmente não implementado no backend)

**Operações sugeridas:**

- `ACCESS_SCREEN_MESSAGES` - Acessar tela
- `SEND_MESSAGES` - Enviar mensagens
- `READ_MESSAGES` - Ler mensagens

### 2.12 Módulo: AUTENTICAÇÃO E PERFIL PRÓPRIO

**Controller:** `AuthController` (`/auth`)

- Endpoints públicos para login, logout, reset de senha

**Controller:** `UserProfileController` (`/user-profile`)

- Gestão do próprio perfil (não identificado nos controllers principais)

**Operações sugeridas:**

- `ACCESS_OWN_PROFILE` - Acessar próprio perfil
- `UPDATE_OWN_PROFILE` - Atualizar próprio perfil
- `CHANGE_OWN_PASSWORD` - Alterar própria senha

## 3. Mapeamento Completo do Frontend

### 3.1 Rotas Públicas

**Arquivo:** `app.routes.ts`

1. `/landing` → `LandingComponent` - Página inicial pública
2. `/login` → `LoginComponent` - Login
3. `/esqueci-senha` → `SolicitarResetComponent` - Solicitar reset
4. `/redefinir-senha` → `RedefinirSenhaComponent` - Redefinir senha
5. `/atualizar-cadastro` → `AtualizarCadastroComponent` - Atualização pública
6. `/adicionar-visitantes` → `AdicionarVisitantesComponent` - Cadastro público
7. `/emprestimo` → `EmprestimoPublicoComponent` - Empréstimo público
8. `/mural/canal` → `ChannelSelectorComponent` - Seleção de canal
9. `/mural/:channelId` → `MuralDigitalComponent` - Mural digital
10. `/mural` → `MuralDigitalComponent` - Mural digital
11. `/lista-presenca` → `ListaPresencaComponent` - Lista de presença pública

### 3.2 Rotas Protegidas (AuthGuard)

1. `/home` → `HomeComponent` - Dashboard principal
2. `/meu-perfil` → `MyProfileComponent` - Perfil do usuário
3. `/appointments` → `AppointmentsComponent` - Agendamentos
4. `/member-management` → `MemberManagementComponent` - Gestão de membros
5. `/messages` → `MessagesComponent` - Mensagens
6. `/whatsapp` → `WhatsAppComponent` - WhatsApp
7. `/user-management` → `UserManagementComponent` - Gestão de usuários
8. `/volunteering` → `GroupManagementComponent` - Voluntariado/Grupos
9. `/visitor-management` → `VisitorManagementComponent` - Gestão de visitantes
10. `/dashboard/attendance` → `AttendanceDashboardComponent` - Dashboard de presença
11. `/loans` → `LoansComponent` - Empréstimos
12. `/banner-management` → `BannerManagementComponent` - Gestão de banners

### 3.3 Rotas com PermissionGuard

1. `/settings` → `SettingsComponent` - Requer `ACCESS_SCREEN_SETTINGS`

### 3.4 Permissões no Sidebar

O `sidebar.component.ts` verifica permissões para exibição de itens:

- `Home` → Sem permissão
- `Mural` → `READ_MEMBERS`
- `Presença` → `READ_MEMBERS`
- `Empréstimos` → `READ_MEMBERS`
- `Agendamentos` → Sem permissão
- `WhatsApp` → Sem permissão
- `Voluntariado` → `READ_MEMBERS`
- `Membros` → Sem permissão
- `Usuários` → Não especificado no código analisado
- `Visitantes` → Não especificado no código analisado

## 4. Grupos de Funcionalidades Sugeridos

### 4.1 GRUPO: GESTÃO DE MEMBROS

**Descrição:** Todas as operações relacionadas ao cadastro, edição e gestão de membros da igreja.

**Permissões:**

- `ACCESS_SCREEN_MEMBER_MANAGEMENT` - Acesso à tela
- `READ_MEMBERS` - Visualizar membros
- `CREATE_MEMBERS` - Criar membros
- `UPDATE_MEMBERS` - Editar membros
- `DELETE_MEMBERS` - Excluir membros
- `UPLOAD_MEMBER_PHOTOS` - Upload de fotos
- `IMPORT_MEMBERS` - Importação em massa
- `EXPORT_MEMBERS` - Exportação de dados
- `VIEW_MEMBER_RELATIONSHIPS` - Ver relacionamentos (cônjuge, filhos, pais)

**Páginas relacionadas:**

- `/member-management`

**Endpoints relacionados:**

- `MemberController`
- `PublicMemberController` (público)

### 4.2 GRUPO: GRUPOS E VOLUNTARIADO

**Descrição:** Gestão de grupos, células e voluntariado, incluindo aprovação de participações.

**Permissões:**

- `ACCESS_SCREEN_VOLUNTEERING` - Acesso à tela
- `READ_GROUPS` - Visualizar grupos
- `CREATE_GROUPS` - Criar grupos
- `UPDATE_GROUPS` - Editar grupos
- `DELETE_GROUPS` - Excluir grupos
- `APPROVE_ENROLLMENTS` - Aprovar participações
- `REJECT_ENROLLMENTS` - Rejeitar participações
- `REMOVE_GROUP_MEMBERS` - Remover membros de grupos
- `VIEW_ENROLLMENT_HISTORY` - Ver histórico de participações
- `CREATE_DIRECT_APPROVAL` - Aprovação direta sem solicitação

**Páginas relacionadas:**

- `/volunteering`

**Endpoints relacionados:**

- `GroupController`
- `GroupEnrollmentController`

### 4.3 GRUPO: PRESENÇA E EVENTOS

**Descrição:** Gestão de eventos, controle de presença e relatórios.

**Permissões:**

- `ACCESS_SCREEN_ATTENDANCE` - Acesso ao dashboard
- `READ_EVENTS` - Visualizar eventos
- `CREATE_EVENTS` - Criar eventos
- `UPDATE_EVENTS` - Editar eventos
- `DELETE_EVENTS` - Excluir eventos
- `MANAGE_ATTENDANCE` - Gerenciar presenças (admin)
- `TOGGLE_PUBLIC_ATTENDANCE` - Alternar presença (público)
- `VIEW_ATTENDANCE_STATS` - Ver estatísticas
- `VIEW_ATTENDANCE_REPORTS` - Ver relatórios detalhados
- `ACCESS_PUBLIC_ATTENDANCE_LIST` - Acessar lista pública

**Páginas relacionadas:**

- `/dashboard/attendance`
- `/lista-presenca` (público)

**Endpoints relacionados:**

- `AttendanceController`

### 4.4 GRUPO: BIBLIOTECA E EMPRÉSTIMOS

**Descrição:** Gestão de livros, empréstimos e devoluções.

**Permissões:**

- `ACCESS_SCREEN_LOANS` - Acesso à tela
- `READ_LOANS` - Visualizar empréstimos
- `CREATE_LOANS` - Criar empréstimos
- `UPDATE_LOANS` - Atualizar empréstimos
- `RETURN_LOANS` - Registrar devoluções
- `READ_BOOKS` - Visualizar livros
- `CREATE_BOOKS` - Cadastrar livros
- `UPDATE_BOOKS` - Editar livros
- `DELETE_BOOKS` - Excluir livros
- `UPLOAD_BOOK_COVERS` - Upload de capas
- `ACCESS_PUBLIC_LOAN` - Acesso público para empréstimo

**Páginas relacionadas:**

- `/loans`
- `/emprestimo` (público)

**Endpoints relacionados:**

- `LoanController`
- `BookController`
- `PublicLoanController` (público)

### 4.5 GRUPO: VISITANTES

**Descrição:** Cadastro e gestão de visitantes, incluindo estatísticas.

**Permissões:**

- `ACCESS_SCREEN_VISITOR_MANAGEMENT` - Acesso à tela
- `READ_VISITORS` - Visualizar visitantes
- `CREATE_VISITORS` - Cadastrar visitantes (admin)
- `UPDATE_VISITORS` - Editar visitantes
- `DELETE_VISITORS` - Excluir visitantes
- `VIEW_VISITOR_STATS` - Ver estatísticas
- `IMPORT_VISITORS` - Importação em massa
- `ACCESS_PUBLIC_VISITOR_REGISTRATION` - Cadastro público

**Páginas relacionadas:**

- `/visitor-management`
- `/adicionar-visitantes` (público)

**Endpoints relacionados:**

- `VisitorController`
- `PublicVisitorController` (público)

### 4.6 GRUPO: USUÁRIOS E PERFIS DO SISTEMA

**Descrição:** Gestão de usuários, perfis e permissões do sistema.

**Permissões:**

- `ACCESS_SCREEN_USER_MANAGEMENT` - Acesso à tela de usuários
- `READ_USERS` - Visualizar usuários
- `CREATE_USERS` - Criar usuários
- `UPDATE_USERS` - Editar usuários
- `DELETE_USERS` - Excluir usuários
- `MANAGE_USER_PHOTOS` - Gerenciar fotos
- `ACCESS_SCREEN_PROFILES` - Acesso à tela de perfis
- `READ_PROFILES` - Visualizar perfis
- `CREATE_PROFILES` - Criar perfis
- `UPDATE_PROFILES` - Editar perfis
- `DELETE_PROFILES` - Excluir perfis
- `ASSIGN_PERMISSIONS` - Atribuir permissões a perfis
- `READ_PERMISSIONS` - Visualizar lista de permissões

**Páginas relacionadas:**

- `/user-management`

**Endpoints relacionados:**

- `UserManagementController`
- `ProfileController`
- `PermissionController`

### 4.7 GRUPO: BANNERS E MURAL DIGITAL

**Descrição:** Gestão de banners, canais e configurações do mural digital.

**Permissões:**

- `ACCESS_SCREEN_BANNER_MANAGEMENT` - Acesso à tela
- `READ_BANNERS` - Visualizar banners
- `CREATE_BANNERS` - Criar banners
- `UPDATE_BANNERS` - Editar banners
- `DELETE_BANNERS` - Excluir banners
- `MANAGE_BANNER_CHANNELS` - Gerenciar canais
- `TOGGLE_BANNER_CHANNELS` - Ativar/desativar canais
- `CONFIGURE_BANNER_DISPLAY` - Configurar exibição
- `VIEW_PUBLIC_MURAL` - Acessar mural público

**Páginas relacionadas:**

- `/banner-management`
- `/mural` (público)
- `/mural/canal` (público)

**Endpoints relacionados:**

- `BannerImageController`
- `BannerChannelController`
- `BannerConfigController`
- `PublicBannerController` (público)

### 4.8 GRUPO: CONFIGURAÇÕES DO SISTEMA

**Descrição:** Configurações gerais do sistema.

**Permissões:**

- `ACCESS_SCREEN_SETTINGS` - Acesso à tela
- `READ_CONFIG` - Visualizar configurações
- `UPDATE_CONFIG` - Editar configurações
- `CREATE_CONFIG` - Criar novas configurações

**Páginas relacionadas:**

- `/settings`

**Endpoints relacionados:**

- `ConfigurationsController`

### 4.9 GRUPO: AGENDAMENTOS

**Descrição:** Sistema de agendamentos e tarefas automatizadas.

**Permissões:**

- `ACCESS_SCREEN_APPOINTMENTS` - Acesso à tela
- `READ_APPOINTMENTS` - Visualizar agendamentos
- `CREATE_APPOINTMENTS` - Criar agendamentos
- `UPDATE_APPOINTMENTS` - Editar agendamentos
- `DELETE_APPOINTMENTS` - Excluir agendamentos
- `EXECUTE_APPOINTMENTS` - Executar agendamentos manualmente
- `VIEW_APPOINTMENT_LOGS` - Ver logs de execução
- `PAUSE_APPOINTMENTS` - Pausar agendamentos
- `RESUME_APPOINTMENTS` - Retomar agendamentos

**Páginas relacionadas:**

- `/appointments`

**Endpoints relacionados:**

- `AppointmentsController`
- `AppointmentExecutionLogController`

### 4.10 GRUPO: WHATSAPP

**Descrição:** Integração com WhatsApp para envio de mensagens.

**Permissões:**

- `ACCESS_SCREEN_WHATSAPP` - Acesso à tela
- `SEND_WHATSAPP_MESSAGES` - Enviar mensagens
- `READ_WHATSAPP_CONTACTS` - Ver contatos
- `READ_WHATSAPP_GROUPS` - Ver grupos
- `VIEW_WHATSAPP_HISTORY` - Ver histórico
- `MANAGE_WHATSAPP_CONNECTION` - Gerenciar conexão
- `CONFIGURE_WHATSAPP` - Configurar integração

**Páginas relacionadas:**

- `/whatsapp`

**Endpoints relacionados:**

- `WhatsappMessageController`
- `WhatsappAuthController`
- `WhatsappConnectionController`

### 4.11 GRUPO: MENSAGENS

**Descrição:** Sistema de mensagens interno (se implementado).

**Permissões:**

- `ACCESS_SCREEN_MESSAGES` - Acesso à tela
- `SEND_MESSAGES` - Enviar mensagens
- `READ_MESSAGES` - Ler mensagens
- `DELETE_MESSAGES` - Excluir mensagens

**Páginas relacionadas:**

- `/messages`

**Endpoints relacionados:**

- Não identificado (possivelmente não implementado)

### 4.12 GRUPO: PERFIL PRÓPRIO

**Descrição:** Gestão do próprio perfil e configurações pessoais.

**Permissões:**

- `ACCESS_OWN_PROFILE` - Acessar próprio perfil
- `UPDATE_OWN_PROFILE` - Atualizar próprio perfil
- `CHANGE_OWN_PASSWORD` - Alterar própria senha
- `UPLOAD_OWN_PHOTO` - Fazer upload da própria foto
- `UPDATE_OWN_PREFERENCES` - Atualizar preferências

**Páginas relacionadas:**

- `/meu-perfil`

**Endpoints relacionados:**

- `UserProfileController`
- `UserPreferenceController`

### 4.13 GRUPO: DASHBOARD E HOME

**Descrição:** Página inicial e dashboard com visão geral.

**Permissões:**

- `ACCESS_SCREEN_HOME` - Acesso à home
- `VIEW_DASHBOARD_STATS` - Ver estatísticas do dashboard
- `VIEW_NOTIFICATIONS` - Ver notificações

**Páginas relacionadas:**

- `/home`

**Endpoints relacionados:**

- Não específico (dados agregados de vários módulos)

## 5. Padrões de Nomenclatura Recomendados

### 5.1 Estrutura de Permissões

```
{ACTION}_{RESOURCE}

Ações:
- ACCESS_SCREEN_ - Acesso à tela/página
- READ_ - Visualizar/Listar
- CREATE_ - Criar/Adicionar
- UPDATE_ - Editar/Atualizar
- DELETE_ - Excluir
- MANAGE_ - Gerenciar (operações complexas)
- VIEW_ - Ver (relatórios, estatísticas)
- IMPORT_ - Importar
- EXPORT_ - Exportar
- CONFIGURE_ - Configurar
- EXECUTE_ - Executar
- TOGGLE_ - Ativar/Desativar
- APPROVE_ - Aprovar
- REJECT_ - Rejeitar
```

### 5.2 Recursos (Resources)

- `MEMBERS` - Membros
- `GROUPS` - Grupos
- `EVENTS` - Eventos
- `ATTENDANCE` - Presença
- `LOANS` - Empréstimos
- `BOOKS` - Livros
- `VISITORS` - Visitantes
- `USERS` - Usuários do sistema
- `PROFILES` - Perfis de acesso
- `PERMISSIONS` - Permissões
- `BANNERS` - Banners
- `APPOINTMENTS` - Agendamentos
- `WHATSAPP` - WhatsApp
- `MESSAGES` - Mensagens
- `CONFIG` - Configurações
- `SETTINGS` - Configurações do sistema

## 6. Recomendações de Implementação

### 6.1 Hierarquia de Permissões

Sugestão de níveis hierárquicos:

1. **Root/Administrador Completo** - Acesso total a tudo
2. **Administrador** - Acesso amplo com algumas restrições
3. **Gestor** - Acesso a módulos específicos (Membros, Grupos, etc.)
4. **Operador** - Acesso limitado (apenas leitura ou operações básicas)
5. **Visualizador** - Apenas leitura
6. **Usuário** - Apenas perfil próprio

### 6.2 Padrão CRUD por Módulo

Para cada módulo, implementar o padrão completo:

```
ACCESS_SCREEN_{MODULE}
READ_{MODULE}
CREATE_{MODULE}
UPDATE_{MODULE}
DELETE_{MODULE}
```

E operações específicas quando necessário:

- `IMPORT_{MODULE}`
- `EXPORT_{MODULE}`
- `MANAGE_{MODULE}`

### 6.3 Implementação de Regras Granulares

Para a tela de gerenciamento de acesso, considerar:

1. **Nível de Página**: Controlar acesso às telas
2. **Nível de Ação**: Controlar botões e ações dentro da tela
3. **Nível de Dados**: Controlar quais dados podem ser acessados
4. **Nível de Campo**: Controlar visibilidade de campos específicos (avançado)

### 6.4 Migração de Permissões Existentes

Mapear permissões antigas para o novo padrão:

- `READ_MEMBERS` → Manter + adicionar `ACCESS_SCREEN_MEMBER_MANAGEMENT`
- `WRITE_MEMBERS` → Dividir em `CREATE_MEMBERS`, `UPDATE_MEMBERS`
- `DELETE_MEMBERS` → Manter
- `READ_VISITORS` → Manter + adicionar `ACCESS_SCREEN_VISITOR_MANAGEMENT`
- `WRITE_VISITORS` → Dividir em `CREATE_VISITORS`, `UPDATE_VISITORS`
- `DELETE_VISITORS` → Manter
- `READ_USERS` → Manter + adicionar `ACCESS_SCREEN_USER_MANAGEMENT`
- `WRITE_USERS` → Dividir em `CREATE_USERS`, `UPDATE_USERS`
- `DELETE_USERS` → Manter
- `READ_PROFILES` → Manter + adicionar `ACCESS_SCREEN_PROFILES`
- `WRITE_PROFILES` → Dividir em `CREATE_PROFILES`, `UPDATE_PROFILES`
- `DELETE_PROFILES` → Manter
- `READ_CONFIG` → Manter + adicionar `ACCESS_SCREEN_SETTINGS`
- `WRITE_CONFIG` → `UPDATE_CONFIG`

### 6.5 Adicionar Permissões para Funcionalidades Sem Proteção

- **Appointments**: Adicionar todas as permissões do grupo
- **WhatsApp**: Adicionar todas as permissões do grupo
- **Messages**: Adicionar todas as permissões do grupo

## 7. Estrutura Sugerida para Tela de Gerenciamento de Acesso

A tela deve permitir:

1. **Visualizar perfis existentes** com suas permissões agrupadas por módulo
2. **Criar/Editar perfis** atribuindo permissões por módulo
3. **Visualizar permissões agrupadas** por grupos de funcionalidades
4. **Marcar/desmarcar todas** as permissões de um módulo
5. **Filtrar permissões** por módulo ou busca
6. **Visualizar usuários** associados a cada perfil
7. **Validar perfis** (não permitir excluir se tiver usuários, não permitir editar ROOT)

## 8. Checklist de Implementação

- [ ] Criar Enum `SystemPermission` com todas as permissões mapeadas
- [ ] Atualizar entidade `Permission` com campo `module` e `key`
- [ ] Criar seeder de permissões sincronizado com Enum
- [ ] Atualizar todos os controllers com `@PreAuthorize` apropriado
- [ ] Implementar `PermissionGuard` no frontend para todas as rotas
- [ ] Atualizar sidebar para verificar permissões de acesso às telas
- [ ] Criar componente de gerenciamento de perfis com interface estilo WordPress
- [ ] Implementar agrupamento de permissões por módulo na interface
- [ ] Adicionar validações (não excluir perfis com usuários, não editar ROOT)
- [ ] Migrar permissões antigas para novo padrão
- [ ] Adicionar permissões faltantes (Appointments, WhatsApp, Messages)
- [ ] Documentar todas as permissões e seus usos