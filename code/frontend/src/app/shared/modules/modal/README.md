# Modal Component

Componente de modal reutilizável para o sistema, facilitando a criação de modais de visualização e edição de dados.

## Uso Básico

### Importar o Componente

```typescript
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';

@Component({
  // ...
  imports: [ModalComponent, /* outros imports */]
})
```

### Exemplo Simples

```html
<app-modal
  [title]="'Título do Modal'"
  [isOpen]="showModal"
  [size]="'medium'"
  (close)="closeModal()">
  
  <p>Conteúdo do modal aqui</p>
</app-modal>
```

### Exemplo com Botões no Rodapé

```typescript
// No componente TypeScript
showModal = false;

getModalButtons(): ModalButton[] {
  return [
    {
      label: 'Cancelar',
      type: 'secondary',
      action: () => this.closeModal()
    },
    {
      label: 'Salvar',
      type: 'primary',
      action: () => this.save()
    }
  ];
}

closeModal() {
  this.showModal = false;
}

save() {
  // Lógica de salvamento
  this.closeModal();
}
```

```html
<app-modal
  [title]="'Editar Item'"
  [isOpen]="showModal"
  [size]="'large'"
  [footerButtons]="getModalButtons()"
  (close)="closeModal()">
  
  <form>
    <!-- Campos do formulário -->
  </form>
</app-modal>
```

## Propriedades

### Inputs

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `title` | `string` | `''` | Título do modal exibido no cabeçalho |
| `isOpen` | `boolean` | `false` | Controla se o modal está aberto ou fechado |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Tamanho do modal |
| `showCloseButton` | `boolean` | `true` | Exibe ou oculta o botão de fechar (×) |
| `closeOnOverlayClick` | `boolean` | `true` | Fecha o modal ao clicar no overlay |
| `footerButtons` | `ModalButton[]` | `[]` | Array de botões para o rodapé |
| `customFooterTemplate` | `TemplateRef<any>` | `undefined` | Template customizado para o rodapé |
| `customHeaderTemplate` | `TemplateRef<any>` | `undefined` | Template customizado para o cabeçalho |

### Outputs

| Evento | Tipo | Descrição |
|-------|------|-----------|
| `close` | `EventEmitter<void>` | Emitido quando o modal é fechado |

## Interface ModalButton

```typescript
interface ModalButton {
  label: string;              // Texto do botão
  action: () => void;         // Função executada ao clicar
  type?: 'primary' | 'secondary' | 'danger';  // Estilo do botão
  disabled?: boolean;         // Se o botão está desabilitado
}
```

## Tamanhos Disponíveis

- **small**: `max-width: 400px` - Para modais pequenos (confirmações, avisos)
- **medium**: `max-width: 600px` - Tamanho padrão (visualização de dados)
- **large**: `max-width: 800px` - Para formulários médios
- **xlarge**: `max-width: 1000px` - Para formulários grandes e complexos

## Exemplos de Uso

### Modal de Visualização (Somente Leitura)

```html
<app-modal
  [title]="'Detalhes do Item'"
  [isOpen]="showViewModal"
  [size]="'medium'"
  [footerButtons]="getViewButtons()"
  (close)="closeViewModal()">
  
  <div class="detail-section">
    <h4>Informações</h4>
    <div class="details-grid">
      <div class="detail-item">
        <label>Nome</label>
        <span>{{ item.name }}</span>
      </div>
      <div class="detail-item">
        <label>Descrição</label>
        <span>{{ item.description }}</span>
      </div>
    </div>
  </div>
</app-modal>
```

### Modal de Edição

```html
<app-modal
  [title]="isEditing ? 'Editar Item' : 'Novo Item'"
  [isOpen]="showEditModal"
  [size]="'large'"
  [footerButtons]="getEditButtons()"
  (close)="closeEditModal()">
  
  <form (ngSubmit)="save()">
    <div class="form-section">
      <h4>Informações Básicas</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome <span class="required">*</span></label>
          <input type="text" [(ngModel)]="currentItem.name" required />
        </div>
      </div>
    </div>
  </form>
</app-modal>
```

### Modal com Botão de Ação Perigosa

```typescript
getDeleteButtons(): ModalButton[] {
  return [
    {
      label: 'Cancelar',
      type: 'secondary',
      action: () => this.closeDeleteModal()
    },
    {
      label: 'Excluir',
      type: 'danger',
      action: () => this.confirmDelete()
    }
  ];
}
```

## Estilos Responsivos

O modal é totalmente responsivo e se adapta automaticamente a telas menores:

- Em dispositivos móveis (`max-width: 768px`):
  - O modal ocupa 100% da largura (com padding)
  - Os botões do rodapé ficam em coluna (empilhados)
  - O padding interno é reduzido

## Notas

- O modal usa `overflow-x: hidden` para prevenir scroll horizontal
- O conteúdo do modal usa `overflow-y: auto` para scroll vertical quando necessário
- O modal possui animações de fade-in e slide-up
- O overlay escurece o fundo quando o modal está aberto
- Clique no overlay fecha o modal (se `closeOnOverlayClick` for `true`)

