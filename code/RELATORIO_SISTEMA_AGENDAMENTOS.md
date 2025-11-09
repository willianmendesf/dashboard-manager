# Relatório Técnico do Sistema de Agendamentos (Jobs)

**Data:** 2025-11-09  
**Sistema:** Dashboard Manager - Backend (Java/Spring Boot)

---

## 1. Configuração Geral do Agendador

### 1.1. Habilitação do Agendador

**Classe:** `AppointmentSchedulerConfig.java`  
**Caminho:** `backend/src/main/java/br/com/willianmendesf/system/configuration/AppointmentSchedulerConfig.java`

A anotação `@EnableScheduling` está presente na linha 16 da classe de configuração:

```java
@Slf4j
@Configuration
@EnableScheduling
@AllArgsConstructor
public class AppointmentSchedulerConfig {
    private final AppointmentSchedulerService schedulerService;
    private final ConfigService configService;
    // ...
}
```

### 1.2. Classe do Job

**Classe:** `AppointmentSchedulerConfig.java` (mesma classe acima)

Esta classe contém **dois métodos agendados**:

1. **`scheduleAppointmentLoad()`** - Linha 26-30
   - **Frequência:** Configurável via propriedade `scheduler.cron.scheduleTimeLoad`
   - **Padrão:** `0 */5 * * * *` (a cada 5 minutos)
   - **Função:** Carrega agendamentos do banco de dados para o cache

2. **`checkScheduledAppointments()`** - Linha 32-35
   - **Frequência:** `fixedRate = 1000` (a cada 1 segundo)
   - **Função:** Verifica e executa agendamentos que estão no momento de execução

---

## 2. Lógica de Execução do Job

### 2.1. Método Agendado Principal: `checkScheduledAppointments()`

**Código completo:**

```java
@Scheduled(fixedRate = 1000)
public void checkScheduledAppointments() {
    schedulerService.checkAndExecuteScheduledAppointments();
}
```

**Método do serviço chamado:**

```java
public void checkAndExecuteScheduledAppointments() {
    Collection<AppointmentEntity> appointments = appointmentCache.getAllAppointments();
    LocalDateTime now = LocalDateTime.now();

    appointments.stream()
            .filter(appointment -> isAppointmentDueForExecution(appointment, now))
            .forEach(this::executeAppointment);
}
```

### 2.2. Método Agendado Secundário: `scheduleAppointmentLoad()`

**Código completo:**

```java
@Scheduled(cron = "${scheduler.cron.scheduleTimeLoad:0 */5 * * * *}")
public void scheduleAppointmentLoad() {
    log.info("Loading appointment scheduled");
    schedulerService.loadAppointmentsToCache();
}
```

### 2.3. Serviços Chamados

O método `checkScheduledAppointments()` chama os seguintes serviços:

1. **`AppointmentSchedulerService.checkAndExecuteScheduledAppointments()`**
   - Acessa o cache de agendamentos (`AppointmentCache`)
   - Filtra agendamentos que devem ser executados
   - Executa cada agendamento encontrado

2. **`AppointmentSchedulerService.executeAppointment()`** (método privado)
   - Executa a tarefa conforme o tipo:
     - `WHATSAPP_MESSAGE`: Chama `executeWhatsAppMessage()` e `executeMonitoringMessage()`
     - `API_CALL`: Chama `executeApiCall()` e `executeMonitoringMessage()`

3. **`WhatsappMessageService.sendMessage()`**
   - Serviço responsável por enviar mensagens WhatsApp
   - **IMPORTANTE:** Este serviço **NÃO possui anotações de segurança** (`@PreAuthorize`)

4. **`AppointmentExecutionRepository.save()`**
   - Salva o registro de execução na tabela `appointment_executions`

5. **`AppointmentRepository.save()`** (via `saveAppointmentSafely()`)
   - Atualiza o agendamento com `lastExecution` e `lastStatus`

---

## 3. Regras de Negócio e Validações

### 3.1. Query de Busca

**Repositório:** `AppointmentRepository.java`

```java
@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByEnabledTrue();
}
```

**Query utilizada:** `findByEnabledTrue()` - Busca todos os agendamentos com `enabled = true`

**Observação:** A query é executada apenas no método `loadAppointmentsToCache()`, que roda a cada 5 minutos. Os agendamentos são mantidos em cache (`AppointmentCache`) e verificados a cada 1 segundo.

### 3.2. Lógica de Recorrência

A recorrência é gerenciada através de **expressões Cron** armazenadas no campo `schedule` da entidade `AppointmentEntity`.

**Processamento:**
1. A expressão cron é parseada usando `CronExpression.parse(appointment.getSchedule())`
2. O próximo horário de execução é calculado com base na última execução: `cronExpression.next(lastExecTime)`
3. O sistema verifica se o horário calculado já chegou ou passou (com tolerância de até 5 segundos)

**Código relevante (linhas 346-395):**

```java
CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());

// Obter a última execução com limite de tempo para evitar execuções muito antigas
LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
        appointment.getLastExecution().toLocalDateTime() :
        now.minusMinutes(maxBacklogMinutes);

// Calcular o próximo horário de execução baseado na última execução agendada
LocalDateTime nextExecution = cronExpression.next(lastExecTime);

// Verificar se já foi executado para este horário agendado específico
boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
        appointment.getId(), nextExecution);

// Verificar se o próximo horário de execução já chegou ou passou
// Usar uma pequena margem de tolerância (até 5 segundos após o horário agendado)
boolean isDue = !nextExecution.isAfter(now);

if (isDue) {
    long secondsSinceScheduled = Duration.between(nextExecution, now).getSeconds();
    // Se passou mais de 5 segundos do horário agendado, não executar
    if (secondsSinceScheduled > 5) {
        return false; // Pula execução perdida
    }
}
```

### 3.3. Validação de Envio (Prevenção de Duplicação)

O sistema utiliza uma **tabela de log de execuções** (`appointment_executions`) para evitar disparos duplicados.

**Entidade:** `AppointmentExecution.java`

```java
@Entity
@Data
public class AppointmentExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long appointmentId;
    
    @Column(nullable = false)
    private LocalDateTime scheduledTime;  // Horário agendado específico
    
    @Column(nullable = false)
    private LocalDateTime executionTime;  // Horário real de execução
    
    @Column(nullable = false)
    private TaskStatus status;  // SUCCESS, FAILURE, PENDING
}
```

**Mecanismo de validação:**

1. **Antes de executar:** Verifica se já existe um registro para o `appointmentId` e `scheduledTime` específico:
   ```java
   boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
           appointment.getId(), nextExecution);
   ```

2. **Após executar:** Cria um novo registro na tabela `appointment_executions`:
   ```java
   AppointmentExecution execution = new AppointmentExecution();
   execution.setAppointmentId(appointment.getId());
   execution.setScheduledTime(scheduledTime);
   execution.setExecutionTime(now);
   execution.setStatus(TaskStatus.SUCCESS);
   executionRepository.save(execution);
   ```

3. **Atualização do agendamento:** Atualiza `lastExecution` com o `scheduledTime` (não o `now`) para garantir cálculo correto da próxima execução:
   ```java
   appointment.setLastExecution(Timestamp.valueOf(scheduledTime));
   ```

**Repositório:**

```java
public interface AppointmentExecutionRepository extends JpaRepository<AppointmentExecution, Long> {
    boolean existsByAppointmentIdAndScheduledTime(Long appointmentId, LocalDateTime scheduledTime);
}
```

---

## 4. Segurança e Transações (Causa Provável da Falha)

### 4.1. Transações

**Análise:**

1. **Método `@Scheduled`:** `checkScheduledAppointments()` **NÃO possui** `@Transactional`
   - O método agendado em si não está em uma transação

2. **Método do serviço:** `checkAndExecuteScheduledAppointments()` **NÃO possui** `@Transactional`
   - A verificação e execução não estão em uma transação única

3. **Método privado:** `executeAppointment()` **NÃO possui** `@Transactional`
   - A execução individual não está em uma transação

4. **Método auxiliar:** `saveAppointmentSafely()` **POSSUI** `@Transactional` (linha 517)
   - Apenas o salvamento do agendamento está em transação

**Problema identificado:**
- A verificação de duplicação (`existsByAppointmentIdAndScheduledTime`) e a criação do registro de execução (`executionRepository.save()`) **não estão na mesma transação** que a execução da tarefa
- Isso pode causar **race conditions** quando múltiplas threads tentam executar o mesmo agendamento simultaneamente

### 4.2. Segurança

**Análise:**

1. **`AppointmentSchedulerService`:** **NÃO possui** anotações `@PreAuthorize`
   - Os métodos são públicos e não requerem autenticação/autorização

2. **`WhatsappMessageService.sendMessage()`:** **NÃO possui** anotações `@PreAuthorize`
   - O método é público e não requer permissões

3. **`AppointmentSchedulerConfig`:** **NÃO possui** anotações de segurança
   - Os métodos `@Scheduled` são executados pelo Spring Scheduler, que roda em um contexto sem autenticação

**Problema identificado:**
- **Os jobs são executados sem contexto de segurança** (sem `Authentication` no `SecurityContext`)
- Se algum serviço chamado (como `WhatsappMessageService`) ou algum método downstream requerer autenticação, a execução falhará silenciosamente ou lançará exceções de segurança

**Verificação necessária:**
- Verificar se `WhatsappMessageService` ou serviços relacionados fazem chamadas que requerem autenticação
- Verificar se há interceptors ou filtros que bloqueiam requisições sem autenticação

---

## 5. Diagnóstico de Problemas Potenciais

### 5.1. Problemas Identificados

#### **Problema 1: Race Condition na Execução**
- **Causa:** Falta de transação única na verificação e execução
- **Sintoma:** Múltiplas execuções do mesmo agendamento
- **Solução:** Envolver `checkAndExecuteScheduledAppointments()` ou `executeAppointment()` em `@Transactional`

#### **Problema 2: Falta de Contexto de Segurança**
- **Causa:** Jobs executam sem `Authentication` no `SecurityContext`
- **Sintoma:** Falhas silenciosas ou exceções de segurança
- **Solução:** Configurar um `SecurityContext` para os jobs ou remover anotações de segurança dos serviços chamados

#### **Problema 3: Janela de Tolerância Muito Restritiva**
- **Causa:** Tolerância de apenas 5 segundos após o horário agendado
- **Sintoma:** Execuções perdidas se o sistema estiver lento ou sobrecarregado
- **Solução:** Aumentar a tolerância ou implementar retry

#### **Problema 4: Falta de Tratamento de Erros em Cascata**
- **Causa:** Se `WhatsappMessageService.sendMessage()` falhar, o erro pode não ser propagado corretamente
- **Sintoma:** Agendamentos marcados como executados mesmo quando falharam
- **Solução:** Melhorar tratamento de exceções e rollback

### 5.2. Logs para Verificação

Verificar nos logs do sistema:

1. **Logs de inicialização:**
   ```
   "Starting appointment scheduled - executing intelligent catch-up"
   "Catch-up completed: processed=X, executed=Y, skipped=Z"
   ```

2. **Logs de execução:**
   ```
   "Start execute appointment: {nome}"
   "Successfully executed catch-up appointment: {nome} at {time}"
   ```

3. **Logs de erro:**
   ```
   "Error ao executar agendamento {id}: {mensagem}"
   "Optimistic locking conflict for appointment {id}"
   ```

4. **Logs de verificação:**
   ```
   "Appointment {id} already executed for scheduled time: {time}"
   "Appointment {id} scheduled time {time} passed more than 5 seconds ago"
   ```

---

## 6. Recomendações de Correção

### 6.1. Adicionar Transação na Execução

```java
@Transactional
public void checkAndExecuteScheduledAppointments() {
    Collection<AppointmentEntity> appointments = appointmentCache.getAllAppointments();
    LocalDateTime now = LocalDateTime.now();

    appointments.stream()
            .filter(appointment -> isAppointmentDueForExecution(appointment, now))
            .forEach(this::executeAppointment);
}
```

### 6.2. Configurar Contexto de Segurança para Jobs

Criar um `SecurityContext` específico para execução de jobs ou garantir que serviços chamados não requeiram autenticação.

### 6.3. Melhorar Tratamento de Race Conditions

Implementar lock pessimista ou otimista mais robusto na verificação de duplicação.

---

## 7. Estrutura de Dados

### 7.1. Tabela `appointments`

- `id`: Long (PK)
- `name`: String
- `schedule`: String (expressão cron)
- `enabled`: Boolean
- `task_type`: Enum (WHATSAPP_MESSAGE, API_CALL)
- `last_execution`: Timestamp
- `last_status`: Enum (SUCCESS, FAILURE, PENDING)
- `version`: Long (para optimistic locking)
- Outros campos de configuração...

### 7.2. Tabela `appointment_executions`

- `id`: Long (PK)
- `appointment_id`: Long (FK)
- `scheduled_time`: LocalDateTime
- `execution_time`: LocalDateTime
- `status`: Enum (SUCCESS, FAILURE, PENDING)

---

**Fim do Relatório**

