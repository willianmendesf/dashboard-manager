<!-- 6c1dd26f-ec31-439c-bdec-b8fbd66bfc9b 941be6f1-4ff6-41fd-ba35-84c6a99e014b -->
# Sistema de Permissões Granular - Planejamento Detalhado

## Arquitetura Geral

**Estrutura:**

- User → Profile (existente) + UserGroups (novo) - ambos independentes
- Permissões granulares por ação: READ, WRITE, DELETE, IMPORT, EXPORT, etc.
- Rotas registradas automaticamente no banco
- Tela de administração de rotas acessível apenas pelo usuário ROOT

## Backend

### 1. Novas Entidades

#### 1.1 RouteEntity.java

- `id`, `path` (ex: "/member-management"), `name` (ex: "Gerenciar Membros"), `description`, `isActive` (boolean)
- `requiredPermission` (String - permissão base, ex: "READ_MEMBERS")
- `createdAt`, `updatedAt`

#### 1.2 UserGroup.java

- `id`, `name`, `description`, `isActive`
- `users` (Many-to-Many com User)
- `permissions` (Many-to-Many com Permission)
- `routes` (Many-to-Many com RouteEntity) - rotas que o grupo pode acessar

#### 1.3 RoutePermission.java (tabela de relacionamento)

- `routeId`, `permissionId`, `action` (READ, WRITE, DELETE, IMPORT, EXPORT)
- Mapeia quais ações cada rota requer

### 2. Expansão de Permissões

#### 2.1 DataInitializationService.java

- Adicionar permissões granulares:
- `IMPORT_MEMBERS`, `EXPORT_MEMBERS`, `IMPORT_VISITORS`, `EXPORT_VISITORS`
- `READ_APPOINTMENTS`, `WRITE_APPOINTMENTS`, `DELETE_APPOINTMENTS`
- `READ_MESSAGES`, `WRITE_MESSAGES`, `DELETE_MESSAGES`
- `READ_WHATSAPP`, `WRITE_WHATSAPP`
- `READ_ANALYTICS`, `READ_PROJECTS`
- `MANAGE_PERMISSIONS` (apenas ROOT)

### 3. RouteRegistryService.java (NOVO)

- `@PostConstruct` ou `@EventListener(ApplicationReadyEvent.class)`
- Escanear `app.routes.ts` via leitura de arquivo ou endpoint dedicado
- Registrar todas as rotas protegidas (com `canActivate: [AuthGuard]` ou `PermissionGuard`)
- Mapear rotas para permissões base (ex: "/member-management" → "READ_MEMBERS")
- Criar RoutePermission para cada ação necessária

### 4. PermissionManagementController.java (NOVO)

- **Apenas ROOT pode acessar** (`@PreAuthorize("hasAuthority('MANAGE_PERMISSIONS')")`)
- Endpoints:
- `GET /permission-management/routes` - Listar todas as rotas
- `GET /permission-management/groups` - Listar grupos
- `POST /permission-management/groups` - Criar grupo
- `PUT /permission-management/groups/{id}` - Atualizar grupo
- `DELETE /permission-management/groups/{id}` - Deletar grupo
- `GET /permission-management/groups/{id}/permissions` - Permissões do grupo
- `PUT /permission-management/groups/{id}/permissions` - Atualizar permissões do grupo
- `PUT /permission-management/groups/{id}/routes` - Atualizar rotas do grupo
- `GET /permission-management/users/{id}/groups` - Grupos do usuário
- `PUT /permission-management/users/{id}/groups` - Atualizar grupos do usuário
- `GET /permission-management/routes/{id}/permissions` - Permissões da rota
- `POST /permission-management/routes/sync` - Sincronizar rotas do frontend

### 5. UserService.java (ATUALIZAR)

- Método `getUserEffectivePermissions(User user)`:
- Unir permissões do Profile + permissões de todos os UserGroups do usuário
- Retornar Set<Permission> consolidado

### 6. CustomUserDetailsService.java (ATUALIZAR)

- Ao carregar User, incluir grupos (EAGER ou JOIN FETCH)
- `getAuthorities()` deve considerar Profile + UserGroups

## Frontend

### 7. Nova Tela: PermissionManagementComponent

#### 7.1 permission-management.component.ts

- Não exibe item de menu para usuário que não são o root
- Verificar se usuário é ROOT
- Propriedades:
- `routes: Route[]`, `groups: UserGroup[]`, `users: User[]`
- `selectedGroup: UserGroup | null`
- `selectedRoute: Route | null`
- Métodos:
- `loadRoutes()`, `loadGroups()`, `loadUsers()`
- `createGroup()`, `updateGroup()`, `deleteGroup()`
- `assignPermissionsToGroup()`, `assignRoutesToGroup()`
- `assignGroupsToUser()`

#### 7.2 permission-management.component.html

- **Aba 1: Rotas**
- Tabela com todas as rotas registradas
- Colunas: Path, Nome, Descrição, Permissão Base, Status
- Botão "Sincronizar Rotas" (chama endpoint de sync)

- **Aba 2: Grupos**
- Lista de grupos com ações (criar, editar, deletar)
- Modal para criar/editar grupo
- Ao selecionar grupo:
- Checkboxes de permissões disponíveis
- Checkboxes de rotas disponíveis
- Salvar associações

- **Aba 3: Usuários**
- Lista de usuários
- Ao selecionar usuário:
- Mostrar Profile atual
- Checkboxes de grupos disponíveis
- Salvar associações

#### 7.3 permission-management.component.scss

- Estilos para abas, tabelas, modais
- Layout similar ao user-management

### 8. Atualizar Guards e Serviços

#### 8.1 permission.guard.ts (ATUALIZAR)

- Verificar permissão específica da rota
- Se rota requer múltiplas permissões, verificar se usuário tem pelo menos uma

#### 8.2 auth.service.ts (ATUALIZAR)

- `hasPermission(permission: string)` - verificar se usuário tem permissão
- `hasAnyPermission(permissions: string[])` - verificar se tem alguma
- `canAccessRoute(route: string)` - verificar se pode acessar rota específica
- `getUserEffectivePermissions()` - retornar todas as permissões (Profile + Groups)

### 9. Atualizar Sidebar

#### 9.1 sidebar.component.ts (ATUALIZAR)

- Filtrar itens do menu baseado em permissões do usuário
- Verificar `canAccessRoute()` para cada rota antes de exibir
- Esconder rotas sem permissão

### 10. Atualizar Componentes Existentes

#### 10.1 member-management.component.ts/html

- Verificar permissões antes de exibir botões:
- `IMPORT_MEMBERS` → mostrar botão importar
- `EXPORT_MEMBERS` → mostrar botão exportar
- `WRITE_MEMBERS` → mostrar botão criar/editar
- `DELETE_MEMBERS` → mostrar botão deletar
- `READ_MEMBERS` → apenas visualizar

#### 10.2 visitor-management.component.ts/html

- Mesma lógica: `IMPORT_VISITORS`, `EXPORT_VISITORS`, `WRITE_VISITORS`, `DELETE_VISITORS`

#### 10.3 Outros componentes

- Aplicar mesma lógica em: appointments, messages, whatsapp, analytics, projects

### 11. Route Sync Service

#### 11.1 route-sync.service.ts (NOVO)

- Método `syncRoutes()`:
- Ler `app.routes.ts` (ou receber via parâmetro)
- Extrair rotas protegidas
- Enviar para backend `/permission-management/routes/sync`
- Backend compara e atualiza banco

## Arquivos a Criar/Modificar

### Backend (Java):

1. `RouteEntity.java` (NOVO)
2. `UserGroup.java` (NOVO)
3. `RoutePermission.java` (NOVO - se necessário como entidade separada)
4. `RouteRepository.java` (NOVO)
5. `UserGroupRepository.java` (NOVO)
6. `RouteRegistryService.java` (NOVO)
7. `PermissionManagementService.java` (NOVO)
8. `PermissionManagementController.java` (NOVO)
9. `DataInitializationService.java` (ATUALIZAR - novas permissões)
10. `UserService.java` (ATUALIZAR - getUserEffectivePermissions)
11. `CustomUserDetailsService.java` (ATUALIZAR - incluir grupos)
12. `User.java` (ATUALIZAR - adicionar relação com UserGroup)

### Frontend (TypeScript/Angular):

1. `permission-management.component.ts` (NOVO)
2. `permission-management.component.html` (NOVO)
3. `permission-management.component.scss` (NOVO)
4. `route-sync.service.ts` (NOVO)
5. `permission-management.service.ts` (NOVO)
6. `app.routes.ts` (ATUALIZAR - adicionar rota permission-management)
7. `sidebar.component.ts` (ATUALIZAR - filtrar por permissões)
8. `auth.service.ts` (ATUALIZAR - métodos de verificação)
9. `permission.guard.ts` (ATUALIZAR - verificação granular)
10. `member-management.component.ts/html` (ATUALIZAR - verificar permissões)
11. `visitor-management.component.ts/html` (ATUALIZAR - verificar permissões)
12. Outros componentes de gestão (ATUALIZAR - verificar permissões)

## Fluxo de Funcionamento

1. **Inicialização:**

- Sistema escaneia `app.routes.ts` e registra rotas no banco
- Cria permissões granulares (READ, WRITE, DELETE, IMPORT, EXPORT)
- Mapeia rotas para permissões base

2. **Login:**

- User carrega Profile + UserGroups
- Permissões efetivas = Profile.permissions + UserGroups.permissions (união)
- Frontend recebe lista de permissões

3. **Navegação:**

- Sidebar filtra rotas baseado em permissões
- PermissionGuard verifica acesso antes de carregar componente
- Componentes verificam permissões antes de exibir ações

4. **Administração (ROOT):**

- Acessa tela de permissões
- Cria/edita grupos
- Atribui permissões e rotas a grupos
- Atribui grupos a usuários
- Sincroniza rotas quando novas telas são adicionadas

## Segurança

- Apenas ROOT pode acessar `/permission-management`
- ROOT não pode ser removido de grupos ou ter permissões alteradas
- Validação no backend: verificar se usuário tem permissão antes de executar ação
- Frontend apenas esconde elementos, backend valida sempre

## Observações

- Grupos são independentes de Profiles (User pode ter Profile "USER" mas estar em grupo "GERENTES" com permissões extras)
- Permissões são união: se Profile tem READ_MEMBERS e Group tem WRITE_MEMBERS, usuário tem ambas
- Rotas são registradas automaticamente, mas ROOT pode desabilitar rotas específicas
- Sistema é extensível: novas rotas são detectadas e registradas automaticamente

### To-dos

- [ ] Criar entidades RouteEntity, UserGroup e relacionamentos (Many-to-Many com User e Permission)
- [ ] Criar RouteRepository e UserGroupRepository com métodos de busca necessários
- [ ] Expandir DataInitializationService para criar permissões granulares (IMPORT, EXPORT, etc) para cada módulo
- [ ] Criar RouteRegistryService para escanear e registrar rotas automaticamente no banco
- [ ] Criar PermissionManagementService com lógica de negócio para gerenciar grupos, rotas e permissões
- [ ] Criar PermissionManagementController com endpoints protegidos por MANAGE_PERMISSIONS (apenas ROOT)
- [ ] Atualizar UserService e CustomUserDetailsService para incluir grupos e calcular permissões efetivas
- [ ] Atualizar entidade User para incluir relação Many-to-Many com UserGroup
- [ ] Criar permission-management.service.ts para comunicação com API de permissões
- [ ] Criar route-sync.service.ts para sincronizar rotas do frontend com backend
- [ ] Criar PermissionManagementComponent completo (TS, HTML, SCSS) com 3 abas: Rotas, Grupos, Usuários
- [ ] Atualizar auth.service.ts com métodos hasPermission, hasAnyPermission, canAccessRoute, getUserEffectivePermissions
- [ ] Atualizar permission.guard.ts para verificar permissões granulares e acesso a rotas
- [ ] Atualizar sidebar.component.ts para filtrar itens do menu baseado em permissões do usuário
- [ ] Atualizar member-management para verificar permissões granulares (IMPORT, EXPORT, WRITE, DELETE) antes de exibir ações
- [ ] Atualizar visitor-management para verificar permissões granulares antes de exibir ações
- [ ] Atualizar outros componentes (appointments, messages, whatsapp, analytics, projects) para verificar permissões
- [ ] Adicionar rota /permission-management em app.routes.ts protegida por PermissionGuard com MANAGE_PERMISSIONS