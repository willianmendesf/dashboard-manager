<!-- 1820e96a-7135-4d8d-8e24-5a6529e174aa d46866ad-6af1-4558-a616-d618f456947b -->
# Sistema RBAC - Implementação Completa

## Análise da Situação Atual

### Implementações Antigas a Remover/Refatorar:

- `Permission.java` - Existe mas falta campos `key` e `module`
- `Profile.java` - Existe mas falta campo `isRoot`
- `DataInitializationService.java` - Cria permissões manualmente, será substituído por seeder baseado em Enum
- `UserEntity.java` - Tem campo `roles` não utilizado (pode ser removido ou ignorado)
- `ProfileController.java` - Existe mas precisa ajustes para nova estrutura
- `PermissionController.java` - Existe mas precisa retornar permissões agrupadas por módulo
- Frontend `user-management` - Usa mapeamento hardcoded de roles, precisa usar perfis dinâmicos

### Padrões Identificados:

- Backend: Spring Boot com JPA, Lombok, estrutura em `br.com.willianmendesf.system`
- Frontend: Angular standalone components, módulos reutilizáveis em `shared/`
- Segurança: `@PreAuthorize("hasAuthority('...')")` em todos os controllers
- API: Base path `/api/v1`, endpoints RESTful
- Frontend: Sistema de abas usando `activeTab` e `switchTab()` (padrão em volunteering, appointments, loans)

## Plano de Implementação

### FASE 1: Backend - Limpeza e Estrutura Base

#### 1.1 Criar Enum SystemPermission

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/enums/SystemPermission.java`

- Enum com todas as permissões do sistema mapeadas
- Campos: `key` (String), `label` (String), `module` (String)
- Métodos: `getKey()`, `getLabel()`, `getModule()`
- Organizar por 12 módulos conforme mapeamento completo:

**Módulo: GESTÃO DE MEMBROS**

- ACCESS_SCREEN_MEMBER_MANAGEMENT, READ_MEMBERS, CREATE_MEMBERS, UPDATE_MEMBERS, DELETE_MEMBERS
- UPLOAD_MEMBER_PHOTOS, IMPORT_MEMBERS, EXPORT_MEMBERS, VIEW_MEMBER_RELATIONSHIPS

**Módulo: GRUPOS E VOLUNTARIADO**

- ACCESS_SCREEN_VOLUNTEERING, READ_GROUPS, CREATE_GROUPS, UPDATE_GROUPS, DELETE_GROUPS
- APPROVE_ENROLLMENTS, REJECT_ENROLLMENTS, REMOVE_GROUP_MEMBERS, VIEW_ENROLLMENT_HISTORY, CREATE_DIRECT_APPROVAL

**Módulo: PRESENÇA E EVENTOS**

- ACCESS_SCREEN_ATTENDANCE, READ_EVENTS, CREATE_EVENTS, UPDATE_EVENTS, DELETE_EVENTS
- MANAGE_ATTENDANCE, TOGGLE_PUBLIC_ATTENDANCE, VIEW_ATTENDANCE_STATS, VIEW_ATTENDANCE_REPORTS, ACCESS_PUBLIC_ATTENDANCE_LIST

**Módulo: BIBLIOTECA E EMPRÉSTIMOS**

- ACCESS_SCREEN_LOANS, READ_LOANS, CREATE_LOANS, UPDATE_LOANS, RETURN_LOANS
- READ_BOOKS, CREATE_BOOKS, UPDATE_BOOKS, DELETE_BOOKS, UPLOAD_BOOK_COVERS, ACCESS_PUBLIC_LOAN

**Módulo: VISITANTES**

- ACCESS_SCREEN_VISITOR_MANAGEMENT, READ_VISITORS, CREATE_VISITORS, UPDATE_VISITORS, DELETE_VISITORS
- VIEW_VISITOR_STATS, IMPORT_VISITORS, ACCESS_PUBLIC_VISITOR_REGISTRATION

**Módulo: USUÁRIOS E PERFIS DO SISTEMA**

- ACCESS_SCREEN_USER_MANAGEMENT, READ_USERS, CREATE_USERS, UPDATE_USERS, DELETE_USERS, MANAGE_USER_PHOTOS
- ACCESS_SCREEN_PROFILES, READ_PROFILES, CREATE_PROFILES, UPDATE_PROFILES, DELETE_PROFILES
- ASSIGN_PERMISSIONS, READ_PERMISSIONS

**Módulo: BANNERS E MURAL DIGITAL**

- ACCESS_SCREEN_BANNER_MANAGEMENT, READ_BANNERS, CREATE_BANNERS, UPDATE_BANNERS, DELETE_BANNERS
- MANAGE_BANNER_CHANNELS, TOGGLE_BANNER_CHANNELS, CONFIGURE_BANNER_DISPLAY, VIEW_PUBLIC_MURAL

**Módulo: CONFIGURAÇÕES DO SISTEMA**

- ACCESS_SCREEN_SETTINGS, READ_CONFIG, UPDATE_CONFIG, CREATE_CONFIG

**Módulo: AGENDAMENTOS**

- ACCESS_SCREEN_APPOINTMENTS, READ_APPOINTMENTS, CREATE_APPOINTMENTS, UPDATE_APPOINTMENTS, DELETE_APPOINTMENTS
- EXECUTE_APPOINTMENTS, VIEW_APPOINTMENT_LOGS, PAUSE_APPOINTMENTS, RESUME_APPOINTMENTS

**Módulo: WHATSAPP**

- ACCESS_SCREEN_WHATSAPP, SEND_WHATSAPP_MESSAGES, READ_WHATSAPP_CONTACTS, READ_WHATSAPP_GROUPS
- VIEW_WHATSAPP_HISTORY, MANAGE_WHATSAPP_CONNECTION, CONFIGURE_WHATSAPP

**Módulo: MENSAGENS**

- ACCESS_SCREEN_MESSAGES, SEND_MESSAGES, READ_MESSAGES, DELETE_MESSAGES

**Módulo: PERFIL PRÓPRIO**

- ACCESS_OWN_PROFILE, UPDATE_OWN_PROFILE, CHANGE_OWN_PASSWORD, UPLOAD_OWN_PHOTO, UPDATE_OWN_PREFERENCES

**Módulo: DASHBOARD E HOME**

- ACCESS_SCREEN_HOME, VIEW_DASHBOARD_STATS, VIEW_NOTIFICATIONS

#### 1.2 Atualizar Entidade Permission

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/Permission.java`

- Adicionar campo `key` (String, unique, not null) - espelho do Enum
- Adicionar campo `module` (String) - para agrupamento
- Manter `id`, `label` (renomear de `description`), `description` (opcional)
- Remover campo `name` (substituído por `key`)

#### 1.3 Atualizar Entidade Profile

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/Profile.java`

- Adicionar campo `isRoot` (Boolean, default false)
- Manter relacionamento `@ManyToMany` com Permission
- Manter relacionamento `@OneToMany` com User

#### 1.4 Criar PermissionSeeder

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/PermissionSeeder.java`

- Implementar `CommandLineRunner` ou `@EventListener(ApplicationReadyEvent.class)`
- Varrer `SystemPermission.values()`
- Para cada permissão: verificar se existe no banco (por `key`)
- Se não existir: criar
- Se existir: atualizar `label` e `module` (sync com Enum)
- Log de operações

#### 1.5 Remover/Refatorar DataInitializationService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/DataInitializationService.java`

- Remover método `createPermissions()` (substituído por PermissionSeeder)
- Manter `createProfiles()` mas atualizar para usar `isRoot` ao invés de verificar nome "ROOT"
- Manter `createDefaultRootUser()` mas atualizar para buscar perfil com `isRoot = true`

### FASE 2: Backend - Segurança e Endpoints

#### 2.1 Atualizar CustomUserDetailsService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/CustomUserDetailsService.java`

- Ao carregar usuário, verificar se `profile.isRoot == true`
- Se `isRoot`: conceder todas as permissões do Enum ou role especial `ROLE_ROOT`
- Caso contrário: carregar permissões do perfil normalmente
- Manter lógica de inicialização Hibernate existente

#### 2.2 Atualizar User.getAuthorities()

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/User.java`

- Se `profile.isRoot == true`: retornar todas as SystemPermission como GrantedAuthority
- Caso contrário: usar permissões do perfil (converter `key` para GrantedAuthority)

#### 2.3 Atualizar PermissionRepository

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/repository/PermissionRepository.java`

- Adicionar método `Optional<Permission> findByKey(String key)`
- Adicionar método `List<Permission> findByModule(String module)`

#### 2.4 Atualizar PermissionController

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/controller/PermissionController.java`

- Endpoint `GET /api/v1/permissions`: Retornar `Map<String, List<PermissionDTO>>` agrupado por módulo
- Usar `PermissionRepository.findByModule()` para agrupar
- Manter `@PreAuthorize("hasAuthority('READ_PROFILES')")`

#### 2.5 Atualizar ProfileController

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/controller/ProfileController.java`

- Endpoint `GET /api/v1/profiles`: Listar todos (já existe)
- Endpoint `GET /api/v1/profiles/{id}`: Detalhes com permissões (já existe)
- Endpoint `POST /api/v1/profiles`: Criar/Editar (atualizar validação de `isRoot`)
- Endpoint `DELETE /api/v1/profiles/{id}`: Validar se há usuários vinculados antes de deletar
- Validar: perfis com `isRoot = true` não podem ser editados (exceto por ROOT)
- Validar: perfis com `isRoot = true` não podem ser deletados

#### 2.6 Atualizar ProfileDTO e PermissionDTO

**Arquivos:**

- `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/ProfileDTO.java`
- `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/PermissionDTO.java`
- ProfileDTO: adicionar campo `isRoot` (Boolean)
- PermissionDTO: adicionar campos `key` (String) e `module` (String)
- Remover campo `name` de PermissionDTO (substituído por `key`)

### FASE 3: Frontend - Integrar Controle de Acesso como Aba em User Management

#### 3.1 Atualizar UserManagementComponent (Adicionar Sistema de Abas)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Adicionar propriedade `activeTab: 'users' | 'profiles' = 'users'`
- Adicionar método `switchTab(tab: 'users' | 'profiles')`
- Adicionar lógica para carregar perfis quando aba 'profiles' for ativada
- Manter toda lógica existente de usuários na aba 'users'

#### 3.2 Adicionar Funcionalidades de Perfis no UserManagementComponent

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Propriedades: `profiles: any[]`, `selectedProfile: any`, `showProfileModal: boolean`, `permissionsGrouped: Map<string, any[]>`
- Métodos:
  - `loadProfiles()` - Carregar lista de perfis do backend (já existe, atualizar)
  - `loadPermissionsGrouped()` - Carregar permissões agrupadas por módulo
  - `openProfileModal(profile?: any)` - Abrir modal de criação/edição
  - `saveProfile()` - Salvar perfil (criar ou atualizar)
  - `deleteProfile(profile: any)` - Excluir perfil (validar usuários vinculados)
  - `toggleAllPermissionsInModule(module: string, checked: boolean)` - Marcar/desmarcar todas do módulo
  - `isAllModulePermissionsSelected(module: string): boolean` - Verificar se todas estão selecionadas
- Validações: não permitir excluir perfis com usuários vinculados, não permitir editar perfis ROOT (exceto se for ROOT)

#### 3.3 Atualizar Template HTML (Adicionar Abas e Conteúdo de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.html`

- Adicionar seção de abas após `<pagetitle>` (seguindo padrão da aplicação):
  ```html
  <div class="filter-tabs">
    <button class="tab-button" [class.active]="activeTab === 'users'" (click)="switchTab('users')">
      Usuários
    </button>
    <button class="tab-button" [class.active]="activeTab === 'profiles'" (click)="switchTab('profiles')">
      Controle de Acesso
    </button>
  </div>
  ```

- Envolver conteúdo atual de usuários em `@if (activeTab === 'users')`
- Adicionar conteúdo da aba perfis em `@if (activeTab === 'profiles')`:
  - Tabela de perfis usando `DataTableComponent` (id, nome, isRoot, quantidade de permissões)
  - Botão "Novo Perfil"
  - Modal de criação/edição de perfil com:
    - Input nome do perfil
    - Checkbox "Perfil Root" (desabilitado se não for ROOT)
    - Matriz de permissões agrupadas por módulo (estilo WordPress)
    - Cards por módulo com checkboxes e descrições
    - Botões "Marcar Todos / Desmarcar Todos" por módulo

#### 3.4 Atualizar Estilos (Adicionar CSS para Abas e Matriz de Permissões)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.scss`

- Adicionar estilos para `.filter-tabs` e `.tab-button` (seguir padrão de outros componentes como volunteering)
- Adicionar estilos para matriz de permissões:
  - `.permissions-matrix` - Container principal
  - `.permission-module` - Card por módulo
  - `.module-header` - Cabeçalho do módulo com botão marcar/desmarcar todos
  - `.permission-item` - Item de permissão com checkbox e label

### FASE 4: Frontend - Atualizar Dropdown de Perfis no Formulário de Usuários

#### 4.1 Atualizar UserManagementComponent (Dropdown de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Remover mapeamento hardcoded de roles (`roleMapping`)
- Atualizar método `loadProfiles()` existente para carregar do endpoint `/api/v1/profiles`
- Atualizar dropdown "Função" no formulário de usuário para usar lista dinâmica de perfis
- Substituir `getProfileIdFromRole()` por seleção direta de `profileId` do dropdown
- Manter compatibilidade com código existente que usa `role` para exibição

#### 4.2 Atualizar Template HTML (Dropdown de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.html`

- Atualizar select "Função" para usar `profiles` array ao invés de options hardcoded
- Usar `ngFor` para iterar sobre `profiles` e exibir nome do perfil
- Manter validações existentes (não permitir alterar função de ROOT, etc.)

### FASE 5: Estrutura Reutilizável e Extensível

#### 5.1 Criar PermissionModuleHelper (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/util/PermissionModuleHelper.java`

- Classe utilitária para facilitar adição de novos módulos
- Método estático `createModulePermissions(String moduleName, String[] actions, String[] resources)` 
- Gera automaticamente permissões no padrão: `{ACTION}_{RESOURCE}`
- Validação de nomenclatura consistente
- Log de permissões criadas

#### 5.2 Criar PermissionConstants (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/constants/PermissionConstants.java`

- Interface com constantes de ações padronizadas: `READ`, `CREATE`, `UPDATE`, `DELETE`, `ACCESS_SCREEN`, etc.
- Constantes de recursos: `MEMBERS`, `USERS`, `GROUPS`, etc.
- Métodos helper para construir chaves de permissão: `buildPermissionKey(String action, String resource)`
- Facilita adição de novas permissões sem erros de digitação

#### 5.3 Criar Annotation @RequiresPermission (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/security/RequiresPermission.java`

- Annotation customizada para simplificar `@PreAuthorize`
- Uso: `@RequiresPermission("READ_MEMBERS")` ao invés de `@PreAuthorize("hasAuthority('READ_MEMBERS')")`
- Processador que converte para `@PreAuthorize` automaticamente
- Facilita migração e manutenção

#### 5.4 Criar PermissionService (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/PermissionService.java`

- Método `validatePermissionExists(String key)` - Valida se permissão existe no Enum
- Método `getPermissionsByModule(String module)` - Busca permissões de um módulo
- Método `getAllModules()` - Lista todos os módulos disponíveis
- Método `registerNewModule(String moduleName, List<SystemPermission> permissions)` - Registra novo módulo dinamicamente

#### 5.5 Criar PermissionGuardHelper (Frontend)

**Arquivo:** `code/frontend/src/app/shared/utils/permission-guard.helper.ts`

- Função `canAccess(permission: string): boolean` - Verifica se usuário tem permissão
- Função `canAccessScreen(screenPermission: string): boolean` - Verifica acesso à tela
- Função `hasAnyPermission(permissions: string[]): boolean` - Verifica múltiplas permissões
- Função `hasAllPermissions(permissions: string[]): boolean` - Verifica todas as permissões

#### 5.6 Criar PermissionService (Frontend)

**Arquivo:** `code/frontend/src/app/shared/services/permission.service.ts`

- Serviço centralizado para gerenciar permissões
- Método `getUserPermissions(): string[]` - Retorna permissões do usuário atual
- Método `checkPermission(permission: string): boolean` - Verifica permissão específica
- Método `getPermissionsByModule(module: string): string[]` - Filtra por módulo
- Observable `permissions# Sistema RBAC - Implementação Completa

## Análise da Situação Atual

### Implementações Antigas a Remover/Refatorar:

- `Permission.java` - Existe mas falta campos `key` e `module`
- `Profile.java` - Existe mas falta campo `isRoot`
- `DataInitializationService.java` - Cria permissões manualmente, será substituído por seeder baseado em Enum
- `UserEntity.java` - Tem campo `roles` não utilizado (pode ser removido ou ignorado)
- `ProfileController.java` - Existe mas precisa ajustes para nova estrutura
- `PermissionController.java` - Existe mas precisa retornar permissões agrupadas por módulo
- Frontend `user-management` - Usa mapeamento hardcoded de roles, precisa usar perfis dinâmicos

### Padrões Identificados:

- Backend: Spring Boot com JPA, Lombok, estrutura em `br.com.willianmendesf.system`
- Frontend: Angular standalone components, módulos reutilizáveis em `shared/`
- Segurança: `@PreAuthorize("hasAuthority('...')")` em todos os controllers
- API: Base path `/api/v1`, endpoints RESTful
- Frontend: Sistema de abas usando `activeTab` e `switchTab()` (padrão em volunteering, appointments, loans)

## Plano de Implementação

### FASE 1: Backend - Limpeza e Estrutura Base

#### 1.1 Criar Enum SystemPermission

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/enums/SystemPermission.java`

- Enum com todas as permissões do sistema mapeadas
- Campos: `key` (String), `label` (String), `module` (String)
- Métodos: `getKey()`, `getLabel()`, `getModule()`
- Organizar por 12 módulos conforme mapeamento completo:

**Módulo: GESTÃO DE MEMBROS**

- ACCESS_SCREEN_MEMBER_MANAGEMENT, READ_MEMBERS, CREATE_MEMBERS, UPDATE_MEMBERS, DELETE_MEMBERS
- UPLOAD_MEMBER_PHOTOS, IMPORT_MEMBERS, EXPORT_MEMBERS, VIEW_MEMBER_RELATIONSHIPS

**Módulo: GRUPOS E VOLUNTARIADO**

- ACCESS_SCREEN_VOLUNTEERING, READ_GROUPS, CREATE_GROUPS, UPDATE_GROUPS, DELETE_GROUPS
- APPROVE_ENROLLMENTS, REJECT_ENROLLMENTS, REMOVE_GROUP_MEMBERS, VIEW_ENROLLMENT_HISTORY, CREATE_DIRECT_APPROVAL

**Módulo: PRESENÇA E EVENTOS**

- ACCESS_SCREEN_ATTENDANCE, READ_EVENTS, CREATE_EVENTS, UPDATE_EVENTS, DELETE_EVENTS
- MANAGE_ATTENDANCE, TOGGLE_PUBLIC_ATTENDANCE, VIEW_ATTENDANCE_STATS, VIEW_ATTENDANCE_REPORTS, ACCESS_PUBLIC_ATTENDANCE_LIST

**Módulo: BIBLIOTECA E EMPRÉSTIMOS**

- ACCESS_SCREEN_LOANS, READ_LOANS, CREATE_LOANS, UPDATE_LOANS, RETURN_LOANS
- READ_BOOKS, CREATE_BOOKS, UPDATE_BOOKS, DELETE_BOOKS, UPLOAD_BOOK_COVERS, ACCESS_PUBLIC_LOAN

**Módulo: VISITANTES**

- ACCESS_SCREEN_VISITOR_MANAGEMENT, READ_VISITORS, CREATE_VISITORS, UPDATE_VISITORS, DELETE_VISITORS
- VIEW_VISITOR_STATS, IMPORT_VISITORS, ACCESS_PUBLIC_VISITOR_REGISTRATION

**Módulo: USUÁRIOS E PERFIS DO SISTEMA**

- ACCESS_SCREEN_USER_MANAGEMENT, READ_USERS, CREATE_USERS, UPDATE_USERS, DELETE_USERS, MANAGE_USER_PHOTOS
- ACCESS_SCREEN_PROFILES, READ_PROFILES, CREATE_PROFILES, UPDATE_PROFILES, DELETE_PROFILES
- ASSIGN_PERMISSIONS, READ_PERMISSIONS

**Módulo: BANNERS E MURAL DIGITAL**

- ACCESS_SCREEN_BANNER_MANAGEMENT, READ_BANNERS, CREATE_BANNERS, UPDATE_BANNERS, DELETE_BANNERS
- MANAGE_BANNER_CHANNELS, TOGGLE_BANNER_CHANNELS, CONFIGURE_BANNER_DISPLAY, VIEW_PUBLIC_MURAL

**Módulo: CONFIGURAÇÕES DO SISTEMA**

- ACCESS_SCREEN_SETTINGS, READ_CONFIG, UPDATE_CONFIG, CREATE_CONFIG

**Módulo: AGENDAMENTOS**

- ACCESS_SCREEN_APPOINTMENTS, READ_APPOINTMENTS, CREATE_APPOINTMENTS, UPDATE_APPOINTMENTS, DELETE_APPOINTMENTS
- EXECUTE_APPOINTMENTS, VIEW_APPOINTMENT_LOGS, PAUSE_APPOINTMENTS, RESUME_APPOINTMENTS

**Módulo: WHATSAPP**

- ACCESS_SCREEN_WHATSAPP, SEND_WHATSAPP_MESSAGES, READ_WHATSAPP_CONTACTS, READ_WHATSAPP_GROUPS
- VIEW_WHATSAPP_HISTORY, MANAGE_WHATSAPP_CONNECTION, CONFIGURE_WHATSAPP

**Módulo: MENSAGENS**

- ACCESS_SCREEN_MESSAGES, SEND_MESSAGES, READ_MESSAGES, DELETE_MESSAGES

**Módulo: PERFIL PRÓPRIO**

- ACCESS_OWN_PROFILE, UPDATE_OWN_PROFILE, CHANGE_OWN_PASSWORD, UPLOAD_OWN_PHOTO, UPDATE_OWN_PREFERENCES

**Módulo: DASHBOARD E HOME**

- ACCESS_SCREEN_HOME, VIEW_DASHBOARD_STATS, VIEW_NOTIFICATIONS

#### 1.2 Atualizar Entidade Permission

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/Permission.java`

- Adicionar campo `key` (String, unique, not null) - espelho do Enum
- Adicionar campo `module` (String) - para agrupamento
- Manter `id`, `label` (renomear de `description`), `description` (opcional)
- Remover campo `name` (substituído por `key`)

#### 1.3 Atualizar Entidade Profile

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/Profile.java`

- Adicionar campo `isRoot` (Boolean, default false)
- Manter relacionamento `@ManyToMany` com Permission
- Manter relacionamento `@OneToMany` com User

#### 1.4 Criar PermissionSeeder

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/PermissionSeeder.java`

- Implementar `CommandLineRunner` ou `@EventListener(ApplicationReadyEvent.class)`
- Varrer `SystemPermission.values()`
- Para cada permissão: verificar se existe no banco (por `key`)
- Se não existir: criar
- Se existir: atualizar `label` e `module` (sync com Enum)
- Log de operações

#### 1.5 Remover/Refatorar DataInitializationService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/DataInitializationService.java`

- Remover método `createPermissions()` (substituído por PermissionSeeder)
- Manter `createProfiles()` mas atualizar para usar `isRoot` ao invés de verificar nome "ROOT"
- Manter `createDefaultRootUser()` mas atualizar para buscar perfil com `isRoot = true`

### FASE 2: Backend - Segurança e Endpoints

#### 2.1 Atualizar CustomUserDetailsService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/CustomUserDetailsService.java`

- Ao carregar usuário, verificar se `profile.isRoot == true`
- Se `isRoot`: conceder todas as permissões do Enum ou role especial `ROLE_ROOT`
- Caso contrário: carregar permissões do perfil normalmente
- Manter lógica de inicialização Hibernate existente

#### 2.2 Atualizar User.getAuthorities()

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/User.java`

- Se `profile.isRoot == true`: retornar todas as SystemPermission como GrantedAuthority
- Caso contrário: usar permissões do perfil (converter `key` para GrantedAuthority)

#### 2.3 Atualizar PermissionRepository

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/repository/PermissionRepository.java`

- Adicionar método `Optional<Permission> findByKey(String key)`
- Adicionar método `List<Permission> findByModule(String module)`

#### 2.4 Atualizar PermissionController

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/controller/PermissionController.java`

- Endpoint `GET /api/v1/permissions`: Retornar `Map<String, List<PermissionDTO>>` agrupado por módulo
- Usar `PermissionRepository.findByModule()` para agrupar
- Manter `@PreAuthorize("hasAuthority('READ_PROFILES')")`

#### 2.5 Atualizar ProfileController

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/controller/ProfileController.java`

- Endpoint `GET /api/v1/profiles`: Listar todos (já existe)
- Endpoint `GET /api/v1/profiles/{id}`: Detalhes com permissões (já existe)
- Endpoint `POST /api/v1/profiles`: Criar/Editar (atualizar validação de `isRoot`)
- Endpoint `DELETE /api/v1/profiles/{id}`: Validar se há usuários vinculados antes de deletar
- Validar: perfis com `isRoot = true` não podem ser editados (exceto por ROOT)
- Validar: perfis com `isRoot = true` não podem ser deletados

#### 2.6 Atualizar ProfileDTO e PermissionDTO

**Arquivos:**

- `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/ProfileDTO.java`
- `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/PermissionDTO.java`
- ProfileDTO: adicionar campo `isRoot` (Boolean)
- PermissionDTO: adicionar campos `key` (String) e `module` (String)
- Remover campo `name` de PermissionDTO (substituído por `key`)

### FASE 3: Frontend - Integrar Controle de Acesso como Aba em User Management

#### 3.1 Atualizar UserManagementComponent (Adicionar Sistema de Abas)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Adicionar propriedade `activeTab: 'users' | 'profiles' = 'users'`
- Adicionar método `switchTab(tab: 'users' | 'profiles')`
- Adicionar lógica para carregar perfis quando aba 'profiles' for ativada
- Manter toda lógica existente de usuários na aba 'users'

#### 3.2 Adicionar Funcionalidades de Perfis no UserManagementComponent

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Propriedades: `profiles: any[]`, `selectedProfile: any`, `showProfileModal: boolean`, `permissionsGrouped: Map<string, any[]>`
- Métodos:
  - `loadProfiles()` - Carregar lista de perfis do backend (já existe, atualizar)
  - `loadPermissionsGrouped()` - Carregar permissões agrupadas por módulo
  - `openProfileModal(profile?: any)` - Abrir modal de criação/edição
  - `saveProfile()` - Salvar perfil (criar ou atualizar)
  - `deleteProfile(profile: any)` - Excluir perfil (validar usuários vinculados)
  - `toggleAllPermissionsInModule(module: string, checked: boolean)` - Marcar/desmarcar todas do módulo
  - `isAllModulePermissionsSelected(module: string): boolean` - Verificar se todas estão selecionadas
- Validações: não permitir excluir perfis com usuários vinculados, não permitir editar perfis ROOT (exceto se for ROOT)

#### 3.3 Atualizar Template HTML (Adicionar Abas e Conteúdo de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.html`

- Adicionar seção de abas após `<pagetitle>` (seguindo padrão da aplicação):
  ```html
  <div class="filter-tabs">
    <button class="tab-button" [class.active]="activeTab === 'users'" (click)="switchTab('users')">
      Usuários
    </button>
    <button class="tab-button" [class.active]="activeTab === 'profiles'" (click)="switchTab('profiles')">
      Controle de Acesso
    </button>
  </div>
  ```

- Envolver conteúdo atual de usuários em `@if (activeTab === 'users')`
- Adicionar conteúdo da aba perfis em `@if (activeTab === 'profiles')`:
  - Tabela de perfis usando `DataTableComponent` (id, nome, isRoot, quantidade de permissões)
  - Botão "Novo Perfil"
  - Modal de criação/edição de perfil com:
    - Input nome do perfil
    - Checkbox "Perfil Root" (desabilitado se não for ROOT)
    - Matriz de permissões agrupadas por módulo (estilo WordPress)
    - Cards por módulo com checkboxes e descrições
    - Botões "Marcar Todos / Desmarcar Todos" por módulo

#### 3.4 Atualizar Estilos (Adicionar CSS para Abas e Matriz de Permissões)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.scss`

- Adicionar estilos para `.filter-tabs` e `.tab-button` (seguir padrão de outros componentes como volunteering)
- Adicionar estilos para matriz de permissões:
  - `.permissions-matrix` - Container principal
  - `.permission-module` - Card por módulo
  - `.module-header` - Cabeçalho do módulo com botão marcar/desmarcar todos
  - `.permission-item` - Item de permissão com checkbox e label

### FASE 4: Frontend - Atualizar Dropdown de Perfis no Formulário de Usuários

#### 4.1 Atualizar UserManagementComponent (Dropdown de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.component.ts`

- Remover mapeamento hardcoded de roles (`roleMapping`)
- Atualizar método `loadProfiles()` existente para carregar do endpoint `/api/v1/profiles`
- Atualizar dropdown "Função" no formulário de usuário para usar lista dinâmica de perfis
- Substituir `getProfileIdFromRole()` por seleção direta de `profileId` do dropdown
- Manter compatibilidade com código existente que usa `role` para exibição

#### 4.2 Atualizar Template HTML (Dropdown de Perfis)

**Arquivo:** `code/frontend/src/app/pages/logged/user-management/user-management.html`

- Atualizar select "Função" para usar `profiles` array ao invés de options hardcoded
- Usar `ngFor` para iterar sobre `profiles` e exibir nome do perfil
- Manter validações existentes (não permitir alterar função de ROOT, etc.)

para reatividade

#### 5.7 Criar Template de Módulo (Documentação)

**Arquivo:** `code/docs/TEMPLATE_NOVO_MODULO.md`

- Template passo-a-passo para adicionar novo módulo
- Exemplo completo: criar módulo "Financeiro" do zero
- Checklist de implementação
- Padrões de nomenclatura obrigatórios

#### 5.8 Criar Script de Validação (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/util/PermissionValidator.java`

- Valida que todas as permissões usadas em `@PreAuthorize` existem no Enum
- Valida que todas as permissões do Enum estão no banco
- Roda no startup e gera warnings/erros
- Facilita identificação de permissões faltantes ou órfãs

#### 5.9 Atualizar PermissionSeeder (Tornar Extensível)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/PermissionSeeder.java`

- Adicionar método `registerModule(String moduleName, SystemPermission[] permissions)`
- Permitir registro dinâmico de novos módulos
- Manter sincronização automática com Enum
- Log detalhado de módulos registrados

#### 5.10 Criar Componente Reutilizável de Permissões (Frontend)

**Arquivo:** `code/frontend/src/app/shared/components/permission-checkbox/permission-checkbox.component.ts`

- Componente reutilizável para exibir checkbox de permissão
- Inputs: `permission`, `module`, `label`, `description`
- Output: `(change)` - Emite quando checkbox muda
- Usado na matriz de permissões do formulário de perfis

#### 5.11 Criar Diretiva *hasPermission (Frontend)

**Arquivo:** `code/frontend/src/app/shared/directives/has-permission.directive.ts`

- Diretiva estrutural para mostrar/ocultar elementos baseado em permissão
- Uso: `*hasPermission="'READ_MEMBERS'"` ou `*hasPermission="['READ_MEMBERS', 'WRITE_MEMBERS']"`
- Suporta múltiplas permissões (OR e AND)
- Facilita controle de visibilidade em templates

#### 5.12 Criar Migration Helper (Backend)

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/util/PermissionMigrationHelper.java`

- Método `migrateOldPermission(String oldKey, String newKey)` - Migra permissão antiga
- Método `mapOldToNewPermissions(Map<String, String>)` - Mapeia múltiplas permissões
- Atualiza perfis existentes automaticamente
- Log de migrações realizadas

### FASE 6: Migração de Dados e Validações

#### 6.1 Script de Migração (Opcional)

- Se necessário, criar script SQL para migrar permissões antigas para nova estrutura
- Mapear `name` antigo para `key` do Enum usando `PermissionMigrationHelper`
- Adicionar campo `module` baseado no prefixo da permissão

#### 6.2 Validações Finais

- Executar `PermissionValidator` no startup
- Verificar que todos os `@PreAuthorize` usam permissões do Enum
- Testar que perfis ROOT têm acesso total
- Testar que seeder sincroniza permissões corretamente
- Validar que frontend carrega perfis dinamicamente
- Testar sistema de abas funcionando corretamente
- Testar helpers e utilitários reutilizáveis

## Arquivos a Criar/Modificar

### Backend (Java):

1. `model/enums/SystemPermission.java` - NOVO
2. `service/PermissionSeeder.java` - NOVO
3. `model/entity/Permission.java` - MODIFICAR
4. `model/entity/Profile.java` - MODIFICAR
5. `service/DataInitializationService.java` - MODIFICAR
6. `service/CustomUserDetailsService.java` - MODIFICAR
7. `model/entity/User.java` - MODIFICAR
8. `repository/PermissionRepository.java` - MODIFICAR
9. `controller/PermissionController.java` - MODIFICAR
10. `controller/ProfileController.java` - MODIFICAR
11. `model/dto/ProfileDTO.java` - MODIFICAR
12. `model/dto/PermissionDTO.java` - MODIFICAR

### Frontend (Angular):

1. `pages/logged/user-management/user-management.component.ts` - MODIFICAR (adicionar abas e funcionalidades de perfis)
2. `pages/logged/user-management/user-management.html` - MODIFICAR (adicionar abas e conteúdo de perfis)
3. `pages/logged/user-management/user-management.scss` - MODIFICAR (adicionar estilos de abas e matriz de permissões)
4. `pages/logged/user-management/model/user.model.ts` - MODIFICAR (manter compatibilidade)

## Observações Importantes

1. **Não quebrar funcionalidades existentes**: Manter compatibilidade com `@PreAuthorize` existentes
2. **Padrão de código**: Seguir estrutura existente (Lombok, JPA, Angular standalone)
3. **Reutilização**: Usar componentes existentes (`DataTableComponent`, `ModalComponent`)
4. **Padrão de abas**: Seguir padrão usado em `volunteering`, `appointments`, `loans`
5. **Validações**: Validar `isRoot` em todas as operações críticas
6. **Performance**: Manter `FetchType.EAGER` em relacionamentos críticos
7. **Logs**: Adicionar logs informativos no seeder e validações

### To-dos

- [ ] Criar Enum SystemPermission com todas as permissões organizadas por módulos
- [ ] Atualizar entidade Permission: adicionar key (unique) e module, remover name
- [ ] Atualizar entidade Profile: adicionar campo isRoot (Boolean)
- [ ] Criar PermissionSeeder que sincroniza Enum com banco de dados
- [ ] Refatorar DataInitializationService: remover createPermissions, atualizar para usar isRoot
- [ ] Atualizar CustomUserDetailsService e User.getAuthorities() para suportar isRoot
- [ ] Atualizar PermissionRepository: adicionar findByKey e findByModule
- [ ] Atualizar ProfileDTO e PermissionDTO: adicionar novos campos (isRoot, key, module)
- [ ] Atualizar PermissionController: retornar permissões agrupadas por módulo
- [ ] Atualizar ProfileController: validações de isRoot, verificar usuários vinculados antes de deletar
- [ ] Criar estrutura de pastas e componentes base para access-control
- [ ] Criar ProfilesComponent: listagem de perfis com ações de editar/excluir
- [ ] Criar ProfileFormComponent: formulário estilo WordPress com checkboxes agrupados por módulo
- [ ] Adicionar rotas para access-control no app.routes.ts
- [ ] Atualizar UserManagementComponent: usar perfis dinâmicos do backend ao invés de mapeamento hardcoded
- [ ] Validar que todas as funcionalidades existentes continuam funcionando e testar novo sistema RBAC