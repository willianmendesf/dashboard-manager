# DataTableComponent

Componente reutilizável de tabela de dados com suporte a ações, ordenação e templates customizados.

## Localização
`src/app/shared/lib/utils/data-table.component.ts`

## Uso Básico

```typescript
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';

// No componente
tableColumns: TableColumn[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status' }
];

tableActions: TableAction[] = [
  {
    label: 'Visualizar',
    icon: 'view',
    action: (row) => this.viewItem(row)
  },
  {
    label: 'Editar',
    icon: 'edit',
    action: (row) => this.editItem(row)
  },
  {
    label: 'Excluir',
    icon: 'delete',
    action: (row) => this.deleteItem(row),
    condition: (row) => row.canDelete // Opcional: condição para exibir ação
  }
];

getTableData(): any[] {
  return this.items.map(item => ({
    ...item,
    _original: item // Manter referência ao objeto original para ações
  }));
}
```

```html
<app-data-table
  [columns]="tableColumns"
  [data]="getTableData()"
  [actions]="getTableActions()"
  [loading]="false"
  emptyMessage="Nenhum item encontrado"
  [striped]="true"
  [hoverable]="true"
></app-data-table>
```

## Uso com Template Customizado

```html
<app-data-table
  [columns]="tableColumns"
  [data]="getTableData()"
  [actions]="getTableActions()"
>
  <ng-template #rowTemplate let-row let-column="column">
    @if (column.key === 'status') {
      <span class="badge" [class]="row.status">{{ row.status }}</span>
    } @else {
      {{ row[column.key] }}
    }
  </ng-template>
</app-data-table>
```

## Inputs

- `columns: TableColumn[]` - Array de colunas da tabela
- `data: any[]` - Array de dados a serem exibidos
- `actions: TableAction[]` - Array de ações disponíveis
- `loading: boolean` - Estado de carregamento
- `emptyMessage: string` - Mensagem quando não há dados
- `rowTemplate?: TemplateRef<any>` - Template customizado para células
- `showHeader: boolean` - Exibir cabeçalho (padrão: true)
- `striped: boolean` - Linhas alternadas (padrão: true)
- `hoverable: boolean` - Efeito hover nas linhas (padrão: true)

## Outputs

- `rowClick: EventEmitter<any>` - Emitido quando uma linha é clicada
- `sortChange: EventEmitter<{ column: string; direction: 'asc' | 'desc' }>` - Emitido quando a ordenação muda

## Interfaces

### TableColumn
```typescript
interface TableColumn {
  key: string;           // Chave do campo no objeto de dados
  label: string;         // Rótulo da coluna
  sortable?: boolean;    // Se a coluna é ordenável
  width?: string;        // Largura da coluna (ex: '200px', '20%')
  align?: 'left' | 'center' | 'right'; // Alinhamento do texto
}
```

### TableAction
```typescript
interface TableAction {
  label: string;                              // Rótulo da ação
  icon: 'view' | 'edit' | 'delete' | 'duplicate' | 'save' | 'copy'; // Ícone
  action: (row: any) => void;                 // Função a ser executada
  condition?: (row: any) => boolean;         // Condição para exibir ação
  class?: string;                            // Classe CSS adicional
}
```

## Recursos

- ✅ Ordenação por coluna (clique no cabeçalho)
- ✅ Ações customizáveis com ícones
- ✅ Templates customizados para células
- ✅ Estados de loading e empty
- ✅ Responsivo
- ✅ Estilos padronizados
- ✅ Suporte a condições para ações

