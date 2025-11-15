<!-- 51e8c964-6b73-4e49-b20a-dd84ef348867 ec077802-a310-437f-b18e-3b00f2d688b1 -->
# Sistema Oração360 - Implementação Completa

## Objetivo

Implementar sistema completo de distribuição automática de orações (Oração360) integrado ao sistema de Appointments existente, garantindo segurança através de modo desenvolvimento ativo por padrão e proteção contra exclusão do agendamento do sistema.

---

## FASE 1: Backend - Entidades e Persistência

### 1.1 Entidades JPA (COMPLETO)

- ✅ `PrayerPerson` - Pessoas (membros e externos)
- ✅ `PrayerDistribution` - Distribuições realizadas
- ✅ `PrayerCycle` - Ciclos completados/resetados
- ✅ `PrayerTemplate` - Templates de mensagem (header/body/mensagens adicionais)
- ✅ `PrayerSchedule` - Agendamentos (não será usado, integrado ao Appointments)

### 1.2 DTOs (COMPLETO)

- ✅ `PrayerPersonDTO`
- ✅ `PrayerDistributionDTO`, `PrayerDistributionRequest`, `PrayerDistributionResponse`
- ✅ `IntercessorDistributionDTO`
- ✅ `DistributionStatisticsDTO`
- ✅ `PrayerConfigDTO` (com ResetAntecipadoConfig)
- ✅ `PrayerTemplateDTO`
- ✅ `PrayerCycleDTO`

### 1.3 Repositories (COMPLETO)

- ✅ `PrayerPersonRepository`
- ✅ `PrayerDistributionRepository`
- ✅ `PrayerCycleRepository`
- ✅ `PrayerTemplateRepository`
- ✅ `PrayerScheduleRepository` (mantido para compatibilidade futura)

---

## FASE 2: Backend - Lógica de Negócio

### 2.1 PrayerRules (COMPLETO)

- ✅ Regra 1: Limite de crianças por intercessor
- ✅ Regra 2: Não orar por si mesmo
- ✅ Regra 3: Unicidade semanal
- ✅ Regra 4: Não repetir até completar ciclo
- ✅ Regra 5: Máximo de nomes por intercessor (com flexibilização)
- ✅ Regra 6: Distribuição justa por histórico
- ✅ Regra 7: Reset de ciclo completo
- ✅ Regra 8: Priorização de crianças por histórico

### 2.2 PrayerDistributionService (COMPLETO)

- ✅ Algoritmo de 4 rodadas de distribuição
- ✅ Sistema de múltiplas tentativas (estrutura base)
- ✅ Reset antecipado (estrutura base)
- ✅ Cálculo de estatísticas
- ✅ Persistência de distribuições

### 2.3 Services de Suporte (COMPLETO)

- ✅ `PrayerPersonService` - CRUD de pessoas
- ✅ `PrayerHistoryService` - Persistência e leitura de histórico
- ✅ `PrayerCycleService` - Gerenciamento de ciclos
- ✅ `PrayerConfigService` - Configurações do sistema
- ✅ `PrayerTemplateService` - Templates com header/body/mensagens adicionais

---

## FASE 3: Backend - Integração com Appointments

### 3.1 Modificar TaskType Enum

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/enums/TaskType.java`

Adicionar novo tipo:

```java
public enum TaskType {
    WHATSAPP_MESSAGE, API_CALL, PRAYER360_DISTRIBUTION
}
```

### 3.2 Adicionar Campo de Proteção em AppointmentEntity

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/AppointmentEntity.java`

Adicionar campo:

```java
@Column(name = "is_system_appointment", nullable = false)
private Boolean isSystemAppointment = false;
```

Atualizar construtores e métodos `setAppointmentEntity` para incluir este campo.

### 3.3 Criar Agendamento Padrão na Inicialização

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/DataInitializationService.java`

Adicionar método `initializePrayer360Appointment()`:

- Criar agendamento "Oração360 - Distribuição Automática"
- `enabled = false` (desabilitado por padrão)
- `development = true` (modo desenvolvimento ATIVO)
- `isSystemAppointment = true` (não pode ser deletado)
- `taskType = PRAYER360_DISTRIBUTION`
- `schedule = "0 0 8 * * MON"` (segunda-feira às 8h - configurável)
- Verificar se já existe antes de criar

### 3.4 Proteger Contra Exclusão

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/AppointmentService.java`

Modificar método `delete()`:

- Verificar se `isSystemAppointment = true`
- Lançar exceção se tentar deletar agendamento do sistema
- Mensagem: "Cannot delete system appointment"

### 3.5 Integrar Execução no AppointmentSchedulerService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/AppointmentSchedulerService.java`

**3.5.1 Adicionar Dependências:**

```java
private final PrayerDistributionService prayerDistributionService;
private final PrayerConfigService prayerConfigService;
private final PrayerTemplateService prayerTemplateService;
private final WhatsappMessageService whatsappMessageService;
```

**3.5.2 Adicionar Case no Switch:**

No método `executeAppointment()`, adicionar:

```java
case PRAYER360_DISTRIBUTION:
    executePrayer360Distribution(appointment);
    break;
```

**3.5.3 Criar Método de Execução:**

```java
private void executePrayer360Distribution(AppointmentEntity appointment) {
    // 1. Verificar modo desenvolvimento
    boolean modoDesenvolvimento = Boolean.TRUE.equals(appointment.getDevelopment());
    
    // 2. Buscar configuração e forçar modo desenvolvimento se necessário
    PrayerConfigDTO config = prayerConfigService.getConfig();
    config.setModoDesenvolvimento(modoDesenvolvimento);
    
    // 3. Gerar distribuição
    PrayerDistributionRequest request = new PrayerDistributionRequest();
    request.setConfig(config);
    PrayerDistributionResponse response = prayerDistributionService.generateDistribution(request);
    
    // 4. Se NÃO estiver em modo desenvolvimento, enviar mensagens WhatsApp
    if (!modoDesenvolvimento) {
        sendPrayer360Messages(response);
    } else {
        log.info("Modo desenvolvimento: Distribuições geradas e salvas, mas mensagens NÃO enviadas");
    }
}
```

**3.5.4 Criar Método de Envio de Mensagens:**

```java
private void sendPrayer360Messages(PrayerDistributionResponse response) {
    // 1. Buscar template padrão
    PrayerTemplateDTO template = prayerTemplateService.getDefault();
    
    // 2. Para cada intercessor na distribuição:
    for (IntercessorDistributionDTO dist : response.getDistributions()) {
        // 3. Gerar mensagens usando template
        List<String> messages = prayerTemplateService.generateMessage(
            convertToEntity(template),
            dist.getIntercessor(),
            dist.getPrayerList(),
            Map.of()
        );
        
        // 4. Enviar cada mensagem via WhatsApp
        for (String message : messages) {
            WhatsappSender sender = new WhatsappSender();
            sender.setPhone(dist.getIntercessor().getCelular());
            sender.setMessage(message);
            whatsappMessageService.sendMessage(sender);
        }
    }
}
```

### 3.6 Adicionar Repository Method

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/repository/AppointmentRepository.java`

Adicionar método:

```java
Optional<AppointmentEntity> findByName(String name);
```

---

## FASE 4: Backend - APIs REST

### 4.1 Controllers (COMPLETO)

- ✅ `PrayerPersonController` - CRUD de pessoas
- ✅ `PrayerDistributionController` - Geração de distribuições
- ✅ `PrayerTemplateController` - Gerenciamento de templates
- ✅ `PrayerConfigController` - Configurações
- ✅ `PrayerHistoryController` - Histórico e ciclos

### 4.2 Permissões (COMPLETO)

- ✅ `ACCESS_PRAYER360` - Acesso ao menu
- ✅ `READ_PRAYER360` - Leitura de dados
- ✅ `WRITE_PRAYER360` - Escrita de dados
- ✅ `MANAGE_PRAYER360_CONFIG` - Gerenciar configurações

---

## FASE 5: Frontend - Estrutura Base

### 5.1 Rotas e Menu (COMPLETO)

- ✅ Rota `/prayer360` adicionada
- ✅ Item "Oração360" no sidebar com ícone
- ✅ Permissão `ACCESS_PRAYER360` aplicada

### 5.2 Modelos TypeScript (COMPLETO)

- ✅ `PrayerPerson`
- ✅ `PrayerDistribution`, `PrayerDistributionRequest/Response`
- ✅ `PrayerConfig`, `ResetAntecipadoConfig`
- ✅ `PrayerTemplate`
- ✅ `PrayerCycle`

### 5.3 Serviço Angular (COMPLETO)

- ✅ `Prayer360Service` com todos os métodos de API

### 5.4 Componente Principal (COMPLETO)

- ✅ `prayer360.component` com layout de abas básico

---

## FASE 6: Frontend - Componentes de Distribuição

### 6.1 Modal de Geração

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/generate-distribution-modal.component.ts`

**Funcionalidades:**

- Seleção de template (dropdown)
- Preview da distribuição antes de gerar
- Opção de usar configuração padrão ou personalizada
- Botão "Gerar Distribuição"
- Loading state durante geração
- Exibição de estatísticas após geração

### 6.2 Visualização de Distribuição

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/distribution-view.component.ts`

**Funcionalidades:**

- Lista de intercessores com suas pessoas atribuídas
- Estatísticas da distribuição
- Botão "Enviar Mensagens" (se não estiver em modo desenvolvimento)
- Botão "Reenviar" individual por intercessor
- Status de envio (PENDING, SENT, FAILED)

---

## FASE 7: Frontend - Gerenciamento de Pessoas

### 7.1 Listagem de Pessoas

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/persons-list.component.ts`

**Funcionalidades:**

- Tabela com filtros (nome, tipo, intercessor, externo)
- Ações: Visualizar, Editar, Excluir
- Botão "Novo" para adicionar pessoa externa
- Botão "Sincronizar com Membros" para importar membros

### 7.2 Formulário de Pessoa

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/person-form.component.ts`

**Funcionalidades:**

- Campos: nome, celular, tipo (CRIANCA/ADULTO), isIntercessor, isExternal
- Seção de responsáveis (pai/mãe) para crianças
- Validações
- Botões: Salvar, Cancelar

### 7.3 Sincronização com Membros

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/sync-members.component.ts`

**Funcionalidades:**

- Lista de membros com filtros
- Seleção múltipla de membros para sincronizar
- Mapeamento: Member → PrayerPerson
- Opção de atualizar existentes ou criar novos

---

## FASE 8: Frontend - Templates e Configurações

### 8.1 Gerenciamento de Templates

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/templates-management.component.ts`

**Funcionalidades:**

- Lista de templates
- Editor com 3 seções:
  - Header (textarea)
  - Formato da Lista (textarea com variáveis [nome], [tipo], [telefone])
  - Body (textarea)
  - Mensagens Adicionais (array de textareas)
- Preview do template com dados de exemplo
- Variáveis disponíveis clicáveis para inserir
- Botões: Novo, Salvar, Duplicar, Definir como Padrão, Deletar

### 8.2 Configurações

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/config-settings.component.ts`

**Funcionalidades:**

- Formulário completo de configurações:
  - Max por intercessor
  - Max crianças por intercessor
  - Limite flexível
  - Reset antecipado (habilitado, tipo, quantidade, etc.)
  - Modo desenvolvimento (checkbox destacado)
- Botão "Salvar" e "Resetar para Padrão"
- Aviso visual quando modo desenvolvimento está ativo

---

## FASE 9: Frontend - Histórico

### 9.1 Histórico de Distribuições

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/distribution-history.component.ts`

**Funcionalidades:**

- Filtros por data (início/fim)
- Lista de distribuições com data, intercessor, quantidade
- Visualização detalhada de cada distribuição
- Exportação de histórico

### 9.2 Histórico por Intercessor

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/intercessor-history.component.ts`

**Funcionalidades:**

- Seleção de intercessor
- Gráfico de progresso do ciclo
- Lista de pessoas já recebidas
- Quantidade restante para completar ciclo
- Botão "Limpar Histórico" (com confirmação)

### 9.3 Ciclos Completados

**Arquivo:** `code/frontend/src/app/pages/logged/prayer360/components/cycles-view.component.ts`

**Funcionalidades:**

- Lista de ciclos completados
- Filtro por intercessor
- Diferenciação entre ciclo completo e reset antecipado
- Data e percentual de conclusão

---

## FASE 10: Integração WhatsApp e Envio

### 10.1 Integração com WhatsappMessageService

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/service/AppointmentSchedulerService.java`

**Método `sendPrayer360Messages()`:**

- Buscar template padrão
- Para cada intercessor:
  - Gerar mensagens usando `PrayerTemplateService.generateMessage()`
  - Enviar mensagem principal via `WhatsappMessageService.sendMessage()`
  - Enviar mensagens adicionais sequencialmente
  - Atualizar status da distribuição (SENT/FAILED)
  - Tratar erros individualmente (não interromper outros envios)

### 10.2 Reenvio Individual

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/controller/PrayerDistributionController.java`

**Endpoint:**

```java
@PostMapping("/{distributionId}/resend/{intercessorId}")
public ResponseEntity<Void> resendMessage(@PathVariable Long distributionId, @PathVariable Long intercessorId)
```

**Lógica:**

- Buscar distribuição e intercessor
- Buscar dados atualizados do intercessor
- Gerar mensagem apenas para esse intercessor
- Enviar via WhatsApp
- Retornar status

---

## FASE 11: Modo Desenvolvimento e Segurança

### 11.1 Comportamento do Modo Desenvolvimento

- **Quando `development = true` no Appointment:**
  - Gera distribuições normalmente
  - Salva tudo no banco (distribuições, histórico, ciclos)
  - NÃO envia mensagens WhatsApp
  - Log detalhado de tudo que seria enviado

- **Quando `development = false`:**
  - Gera distribuições
  - Salva no banco
  - Envia mensagens WhatsApp normalmente

### 11.2 Inicialização Segura

- Agendamento criado com `enabled = false` (não executa automaticamente)
- Agendamento criado com `development = true` (modo desenvolvimento ativo)
- Agendamento marcado como `isSystemAppointment = true` (não pode ser deletado)
- Usuário deve habilitar manualmente após configurar

### 11.3 Validações de Segurança

- Verificar modo desenvolvimento antes de enviar qualquer mensagem
- Logs claros indicando modo desenvolvimento
- Avisos visuais no frontend quando modo desenvolvimento está ativo

---

## FASE 12: Modificação MemberEntity

### 12.1 Adicionar Campo podeReceberOracao

**Arquivo:** `code/backend/src/main/java/br/com/willianmendesf/system/model/entity/MemberEntity.java`

Campo já existe (linha 44-45):

```java
@Column(name = "pode_receber_oracao", nullable = false)
private Boolean podeReceberOracao = true;
```

### 12.2 Atualizar Frontend Member Management

**Arquivo:** `code/frontend/src/app/pages/logged/member-management/member-management.component.ts`

Adicionar campo no formulário:

- Checkbox "Pode Receber Oração"
- Incluir na tabela de listagem (coluna opcional)
- Incluir no filtro (opcional)

---

## FASE 13: Agendamento Automático

### 13.1 Integração com Appointments (COMPLETO)

- ✅ TaskType PRAYER360_DISTRIBUTION adicionado
- ✅ Campo isSystemAppointment adicionado
- ✅ Inicialização do agendamento padrão
- ✅ Proteção contra exclusão
- ✅ Execução integrada no AppointmentSchedulerService

### 13.2 Configuração do Agendamento

- Agendamento aparece na tela de Appointments
- Pode ser editado (schedule, enabled, development)
- NÃO pode ser deletado
- Visual diferenciado indicando que é agendamento do sistema

---

## Decisões Arquiteturais

1. **Persistência**: Banco de dados (tabelas `prayer_distribution`, `prayer_cycle`)
2. **Pessoas**: Nova entidade `PrayerPerson` separada de `Member`, com CRUD completo, import/export
3. **Templates**: Banco de dados (tabela `prayer_template`) com estrutura header/body/mensagens adicionais
4. **Permissões**: `ACCESS_PRAYER360` (menu) + `READ_PRAYER360`, `WRITE_PRAYER360`, `MANAGE_PRAYER360_CONFIG`
5. **Modo de Desenvolvimento**: Flag `development` no Appointment, quando true: gera e salva, mas NÃO envia mensagens
6. **Agendamento Automático**: Integrado ao sistema de Appointments existente
7. **Proteção**: Agendamento do sistema não pode ser deletado (`isSystemAppointment = true`)
8. **Inicialização Segura**: Agendamento criado desabilitado e em modo desenvolvimento por padrão
9. **Reutilização**: Usar `WhatsappMessageService` existente, não duplicar código
10. **Variáveis de Template**: Suporte a `{{variavel}}` (globais) e `[variavel]` (por pessoa), configurável

---

## Comportamento na Inicialização

### O que acontece quando a aplicação inicia:

1. **DataInitializationService.initializeData():**

   - Cria permissões do Oração360 (ACCESS_PRAYER360, READ_PRAYER360, etc.)
   - Cria perfis (ROOT, ADMIN, USER) com permissões

2. **DataInitializationService.initializePrayer360Appointment() (NOVO):**

   - Verifica se existe agendamento "Oração360 - Distribuição Automática"
   - Se não existe, cria com:
     - `name = "Oração360 - Distribuição Automática"`
     - `enabled = false` (DESABILITADO - não executa automaticamente)
     - `development = true` (MODO DESENVOLVIMENTO ATIVO)
     - `isSystemAppointment = true` (NÃO PODE SER DELETADO)
     - `taskType = PRAYER360_DISTRIBUTION`
     - `schedule = "0 0 8 * * MON"` (segunda-feira às 8h)
   - Se existe, garante que está marcado como sistema e em modo desenvolvimento

3. **AppointmentSchedulerConfig.init():**

   - Carrega agendamentos do banco para cache
   - NÃO executa distribuições (agendamento está desabilitado)

4. **AppointmentSchedulerConfig.checkScheduledAppointments():**

   - Roda a cada 1 segundo
   - Verifica agendamentos habilitados
   - Se Oração360 estiver habilitado E não estiver em modo desenvolvimento, executa distribuição e envia mensagens
   - Se Oração360 estiver habilitado E estiver em modo desenvolvimento, executa distribuição mas NÃO envia mensagens

### Segurança Garantida:

- ✅ Agendamento criado DESABILITADO por padrão
- ✅ Modo desenvolvimento ATIVO por padrão
- ✅ Não pode ser deletado
- ✅ Usuário deve habilitar manualmente após configurar
- ✅ Mesmo habilitado, se modo desenvolvimento estiver ativo, não envia mensagens

---

## TODOs de Implementação

1. Adicionar TaskType PRAYER360_DISTRIBUTION
2. Adicionar campo isSystemAppointment em AppointmentEntity
3. Criar método initializePrayer360Appointment no DataInitializationService
4. Proteger delete() no AppointmentService
5. Adicionar findByName no AppointmentRepository
6. Integrar execução no AppointmentSchedulerService (case PRAYER360_DISTRIBUTION)
7. Criar método executePrayer360Distribution
8. Criar método sendPrayer360Messages
9. Adicionar campo podeReceberOracao no frontend member-management
10. Criar componentes frontend de distribuição (modal, visualização)
11. Criar componentes frontend de pessoas (listagem, formulário, sincronização)
12. Criar componentes frontend de templates e configurações
13. Criar componentes frontend de histórico
14. Implementar reenvio individual de mensagens
15. Testes e validações