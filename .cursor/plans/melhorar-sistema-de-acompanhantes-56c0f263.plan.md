<!-- 56c0f263-f2a2-452e-97ea-09dc3e4302a9 da340beb-a67d-4868-91e2-245ee2bdb40c -->
# Melhorar Sistema de Acompanhantes

## Objetivo

Expandir o formulário de acompanhantes para incluir todos os campos do visitante principal, com apenas o nome sendo obrigatório. Adicionar checkbox para copiar dados do anfitrião, facilitando o cadastro de filhos/crianças ou pessoas da mesma igreja.

## Mudanças Necessárias

### Backend

1. **Atualizar `AccompanyingVisitorDTO.java`**

- Adicionar todos os campos do `CreateVisitorDTO`:
- `telefone` (opcional)
- `jaFrequentaIgreja` (opcional)
- `nomeIgreja` (opcional)
- `procuraIgreja` (opcional)
- `eDeSP` (opcional)
- `estado` (opcional)
- Manter `nomeCompleto` (obrigatório) e `relationship` (obrigatório)
- Manter `age` (opcional)

2. **Atualizar `VisitorService.java` (método `createGroup`)**

- Modificar lógica para usar os dados do DTO do acompanhante quando fornecidos
- Se campos não forem fornecidos no DTO, copiar do visitante principal (comportamento atual)
- Garantir que apenas `nomeCompleto` seja obrigatório

### Frontend

3. **Atualizar `AccompanyingVisitorDTO` interface em `public-visitor.service.ts`**

- Adicionar todos os campos opcionais do visitante

4. **Atualizar `adicionar-visitantes.component.ts`**

- Modificar `addAccompanying()` para criar FormGroup com todos os campos do visitante
- Adicionar campo `copyFromHost` (checkbox) no FormGroup de cada acompanhante
- Implementar método `copyHostDataToAccompanying(index: number)` que:
- Copia dados do visitante principal quando checkbox está marcado
- Limpa campos quando desmarcado (ou mantém, dependendo da resposta do usuário)
- Atualizar `onSubmit()` para enviar todos os campos do acompanhante no DTO
- Ajustar validação: apenas `nomeCompleto` obrigatório para acompanhantes

5. **Atualizar `adicionar-visitantes.component.html`**

- Adicionar checkbox "Copiar dados do anfitrião" em cada acompanhante
- Adicionar todos os campos do visitante no formulário de acompanhante:
- Telefone
- Já Frequenta Igreja?
- Nome da Igreja (condicional)
- Está à Procura de uma Igreja?
- É de SP?
- Estado (condicional)
- Aplicar lógica condicional similar ao visitante principal
- Desabilitar campos quando checkbox estiver marcado (ou não, dependendo da resposta)

## Arquivos a Modificar

- `code/backend/src/main/java/br/com/willianmendesf/system/model/dto/AccompanyingVisitorDTO.java`
- `code/backend/src/main/java/br/com/willianmendesf/system/service/VisitorService.java`
- `code/frontend/src/app/shared/service/public-visitor.service.ts`
- `code/frontend/src/app/pages/public/adicionar-visitantes/adicionar-visitantes.component.ts`
- `code/frontend/src/app/pages/public/adicionar-visitantes/adicionar-visitantes.component.html`

## Observações

- O campo `relationship` permanece obrigatório
- O campo `nomeCompleto` é o único obrigatório além do `relationship`
- Todos os outros campos são opcionais
- A lógica de cópia deve ser inteligente: quando marcado, copia; quando desmarcado, permite preenchimento manual