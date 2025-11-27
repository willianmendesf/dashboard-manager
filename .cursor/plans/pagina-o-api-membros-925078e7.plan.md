<!-- 925078e7-9153-43ae-97e4-cb447f21c988 36b4a4db-b738-4052-bdad-45353f5c04cb -->
# Implementação de Paginação na API de Membros

## Objetivo

Otimizar o carregamento da página de membros (atualmente 47s) implementando paginação server-side e criando endpoint de contagem para telas como a home.

## Backend

### 1. Criar DTO de Resposta Paginada

- **Arquivo**: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/PagedResponseDTO.java`
- Criar classe genérica `PagedResponseDTO<T>` com:
- `content: List<T>` - lista de itens da página
- `totalElements: long` - total de itens
- `totalPages: int` - total de páginas
- `currentPage: int` - página atual
- `pageSize: int` - tamanho da página

### 2. Criar DTO de Contagem

- **Arquivo**: `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/MemberCountDTO.java`
- Criar classe simples com campo `count: long`

### 3. Modificar MemberService

- **Arquivo**: `code/backend/src/main/java/br/com/willianmendesf/system/service/MemberService.java`
- Adicionar método `getAllPaged(Pageable pageable)` que retorna `PagedResponseDTO<MemberDTO>`
- Adicionar método `getCount()` que retorna `long` (quantidade total de membros)
- Manter método `getAll()` existente para compatibilidade (pode ser deprecado depois)
- Usar `Pageable` do Spring Data para paginação no repository

### 4. Modificar MemberRepository

- **Arquivo**: `code/backend/src/main/java/br/com/willianmendesf/system/repository/MemberRepository.java`
- Adicionar método `findAllWithGroups(Pageable pageable)` que retorna `Page<MemberEntity>`
- Manter método existente `findAllWithGroups()` para compatibilidade

### 5. Modificar MemberController

- **Arquivo**: `code/backend/src/main/java/br/com/willianmendesf/system/controller/MemberController.java`
- Modificar `getAll()` para aceitar parâmetros opcionais:
- `@RequestParam(required = false) Integer page` (default: 0)
- `@RequestParam(required = false) Integer size` (default: 10)
- `@RequestParam(required = false) Long groupId` (manter compatibilidade)
- Retornar `PagedResponseDTO<MemberDTO>` quando page/size forem fornecidos
- Retornar `List<MemberDTO>` quando page/size não forem fornecidos (compatibilidade)
- Adicionar endpoint `GET /members/count` que retorna `MemberCountDTO`

## Frontend

### 6. Atualizar MemberService (Frontend)

- **Arquivo**: `code/frontend/src/app/shared/service/member.service.ts`
- Adicionar método `getAllPaged(page: number, size: number): Observable<PagedResponse<MemberDTO>>`
- Adicionar método `getCount(): Observable<number>`
- Manter método `getAll()` existente para compatibilidade

### 7. Criar Interface de Resposta Paginada (Frontend)

- **Arquivo**: `code/frontend/src/app/shared/service/member.service.ts` (adicionar interface)
- Criar interface `PagedResponse<T>` com:
- `content: T[]`
- `totalElements: number`
- `totalPages: number`
- `currentPage: number`
- `pageSize: number`

### 8. Modificar MemberManagementComponent

- **Arquivo**: `code/frontend/src/app/pages/logged/member-management/member-management.component.ts`
- Modificar `getMembers()` para usar paginação server-side:
- Adicionar propriedades `currentPage: number = 0`, `pageSize: number = 10`, `totalMembers: number = 0`
- Chamar `memberService.getAllPaged(currentPage, pageSize)` ao invés de `getAll()`
- Atualizar `totalMembers` com `totalElements` da resposta
- Remover carregamento de enrollments em loop (linha 301-304) - carregar apenas para membros da página atual
- Adicionar método `loadPage(page: number)` para carregar página específica
- Adicionar método `onPageChange(page: number)` para ser chamado pelo DataTable
- Modificar `filterMembers()` para manter filtros locais mas aplicar paginação server-side
- Atualizar DataTable para usar `totalMembers` como `totalItems` e emitir evento de mudança de página

### 9. Modificar DataTableComponent (se necessário)

- **Arquivo**: `code/frontend/src/app/shared/lib/utils/data-table.component.ts`
- Adicionar `@Input() totalItems: number` para permitir total externo (server-side)
- Adicionar `@Output() pageChange = new EventEmitter<number>()` para notificar mudanças de página
- Modificar lógica de paginação para usar `totalItems` quando fornecido (server-side) ou `data.length` (client-side)

### 10. Atualizar HomeComponent

- **Arquivo**: `code/frontend/src/app/pages/logged/home/home.component.ts`
- Modificar `getValues()` para usar `memberService.getCount()` ao invés de `getAll()`
- Atualizar `this.members.length` para usar o valor retornado de `getCount()`

### 11. Atualizar AttendanceDashboardComponent

- **Arquivo**: `code/frontend/src/app/pages/logged/attendance/attendance-dashboard.component.ts`
- Modificar `loadTotalMembers()` para usar `memberService.getCount()` ao invés de `getAll()`

### 12. Atualizar GroupManagementComponent (Volunteering)

- **Arquivo**: `code/frontend/src/app/pages/logged/volunteering/volunteering.component.ts`
- Avaliar se `loadMembers()` precisa de paginação ou se pode manter como está (filtra por enrollments aprovados)

## Considerações

- Manter compatibilidade: endpoints antigos continuam funcionando
- Paginação padrão: 10 itens por página, página inicial 0
- Filtros: manter filtros locais no frontend, mas considerar mover para backend no futuro
- Enrollments: carregar apenas para membros da página atual para otimizar

### To-dos

- [ ] Criar PagedResponseDTO.java e MemberCountDTO.java no backend
- [ ] Adicionar método findAllWithGroups(Pageable) no MemberRepository
- [ ] Implementar getAllPaged() e getCount() no MemberService
- [ ] Modificar MemberController para aceitar parâmetros de paginação e criar endpoint /count
- [ ] Criar interface PagedResponse<T> e métodos getAllPaged() e getCount() no MemberService (frontend)
- [ ] Adicionar suporte a paginação server-side no DataTableComponent (totalItems externo e evento pageChange)
- [ ] Modificar MemberManagementComponent para usar paginação server-side
- [ ] Atualizar HomeComponent para usar getCount() ao invés de getAll()
- [ ] Atualizar AttendanceDashboardComponent para usar getCount()