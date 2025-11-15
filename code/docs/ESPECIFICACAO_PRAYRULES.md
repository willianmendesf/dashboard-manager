# Especificação Técnica Completa - Sistema PrayRules

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estruturas de Dados](#estruturas-de-dados)
3. [Regras de Negócio](#regras-de-negócio)
4. [Algoritmos de Distribuição](#algoritmos-de-distribuição)
5. [Gerenciamento de Histórico](#gerenciamento-de-histórico)
6. [Configurações](#configurações)
7. [Fluxos de Execução](#fluxos-de-execução)
8. [Validações e Tratamento de Erros](#validações-e-tratamento-de-erros)
9. [Considerações para Implementação Java/Angular](#considerações-para-implementação-javaangular)

---

## 1. Visão Geral

### 1.1 Propósito
O sistema PrayRules é um algoritmo de distribuição inteligente de pessoas para intercessores, garantindo:
- Distribuição justa e equilibrada
- Evitar repetições até completar ciclo completo
- Respeitar limites por intercessor
- Priorizar distribuição de crianças de forma equilibrada
- Gerenciar ciclos de oração com reset automático

### 1.2 Componentes Principais

1. **PrayRulesImplementation**: Classe principal que orquestra a distribuição
2. **PrayerRules**: Classe contendo todas as regras de negócio puras
3. **HistoryManager**: Gerenciador de persistência de histórico
4. **Configuração**: Objeto de configuração flexível

---

## 2. Estruturas de Dados

### 2.1 Pessoa (Candidato/Intercessor)

```typescript
interface Pessoa {
  NOME: string;                    // Nome da pessoa (obrigatório)
  CELULAR?: string;                // Telefone (opcional)
  TIPO: string;                    // "CRIANÇA", "Criança", "crianca", "criança" ou outro (adulto)
  INTERCESSOR: boolean | string;   // true, "SIM", "sim", 1 = é intercessor
  NOMEPAI?: string;                // Nome do pai (apenas para crianças)
  TELEFONEPAI?: string;            // Telefone do pai (apenas para crianças)
  NOMEMAE?: string;                // Nome da mãe (apenas para crianças)
  TELEFONEMAE?: string;            // Telefone da mãe (apenas para crianças)
  responsavel?: Array<{            // Array de responsáveis (apenas para crianças)
    pai: { nome: string, numero: string },
    mae: { nome: string, numero: string }
  }>;
}
```

### 2.2 Configuração do Sistema

```typescript
interface Config {
  contextKey: string;              // Chave do contexto (ex: "prayer")
  campoIntercessor: string;        // Nome do campo que indica intercessor (ex: "INTERCESSOR")
  campoNome: string;               // Nome do campo de nome (ex: "NOME")
  campoTelefone: string;           // Nome do campo de telefone (ex: "CELULAR")
  campoTipo: string;               // Nome do campo de tipo (ex: "TIPO")
  maxPorIntercessor: number;       // Máximo de nomes por intercessor (padrão: 3)
  maxCriancasPorIntercessor: number; // Máximo de crianças por intercessor (padrão: 1)
  limiteFlexivel: number;          // Limite flexível quando todos atingiram máximo (padrão: 5)
  
  resetAntecipado: {
    habilitado: boolean;           // Habilita reset antecipado (padrão: false)
    tipo: 'fixo' | 'dinamico' | 'proporcional'; // Tipo de reset (padrão: 'fixo')
    quantidade: number;            // Número fixo ou percentual (0-1) (padrão: 3)
    limiteProximidade: number;     // Quantos nomes restantes para considerar "próximo" (padrão: 30)
    limiteDistribuicao: number;    // Limite para considerar distribuição baixa (0-1) (padrão: 0.9)
    maxTentativas: number;         // Máximo de tentativas de reset (padrão: 1)
    tentativasHabilitadas: boolean; // Habilita sistema de múltiplas tentativas (padrão: false)
  };
}
```

### 2.3 Distribuição (Resultado)

```typescript
interface IntercessorDistribuicao {
  [campoNome]: string;             // Nome do intercessor
  [campoTelefone]: string;         // Telefone do intercessor
  prayerList: Array<{              // Lista de pessoas atribuídas
    [campoNome]: string;
    [campoTipo]: string;
    [campoTelefone]?: string;
    responsavel?: Array<{          // Apenas para crianças
      pai: { nome: string, numero: string },
      mae: { nome: string, numero: string }
    }>;
  }>;
}
```

### 2.4 Histórico (Estrutura de Persistência)

```json
{
  "2024-01-15": [
    {
      "NOME": "Intercessor1",
      "CELULAR": "11999999999",
      "prayerList": [
        {
          "NOME": "Pessoa1",
          "TIPO": "adulto",
          "CELULAR": "11888888888"
        },
        {
          "NOME": "Pessoa2",
          "TIPO": "crianca",
          "CELULAR": "11777777777",
          "responsavel": [...]
        }
      ]
    }
  ],
  "2024-01-22": [...]
}
```

### 2.5 Registro de Ciclos Completados

```json
{
  "2024-01-15": [
    {
      "NOME": "Intercessor1"
    },
    {
      "NOME": "Intercessor2",
      "tipoReset": "antecipado",
      "motivo": "distribuição baixa",
      "percentualCompleto": 85.5,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 3. Regras de Negócio

### 3.1 Regra 1: Limite de Crianças por Intercessor

**Descrição**: Cada intercessor deve receber no máximo 1 criança na primeira passada. Se ainda houver crianças não distribuídas, pode-se atribuir mais na segunda passada.

**Validação**:
- Verificar se o intercessor já tem criança na lista: `prayerList` contém item com `TIPO` igual a "crianca", "criança", "CRIANÇA" ou "Criança" (case-insensitive)
- Na primeira passada: bloquear se já tem 1 criança
- Na segunda passada: permitir mesmo se já tem 1 criança

**Priorização**: Intercessores que nunca receberam crianças têm prioridade.

**Método**: `jaTemCrianca(distribuicaoIntercessor, campoTipo) -> boolean`

### 3.2 Regra 2: Não Orar por Si Mesmo

**Descrição**: Um intercessor nunca pode receber a si mesmo na lista de oração.

**Validação**:
- Comparar `nomeIntercessor === nomePessoa` (comparação exata, case-sensitive)

**Método**: `podeOrarPorPessoa(nomeIntercessor, nomePessoa) -> boolean`

### 3.3 Regra 3: Unicidade Semanal

**Descrição**: Cada pessoa só pode ser atribuída uma vez por semana (por execução da distribuição).

**Validação**:
- Manter um `Set` de nomes já atribuídos na semana atual
- Verificar se `nomePessoa` está no `Set` antes de atribuir

**Método**: `jaFoiAtribuidoNaSemana(nomePessoa, atribuidosNaSemana) -> boolean`

### 3.4 Regra 4: Não Repetir até Completar Ciclo

**Descrição**: Um intercessor não pode receber a mesma pessoa novamente até ter orado por todas as outras pessoas (exceto ele mesmo).

**Validação**:
1. Construir conjunto de pessoas já recebidas pelo intercessor no histórico completo
2. Calcular total de pessoas disponíveis: `totalPessoas - 1` (excluindo o próprio intercessor)
3. Se `pessoasRecebidas.size >= totalPessoas - 1`: ciclo completo, pode receber qualquer um
4. Se ciclo não completo: verificar se `nomePessoa` está no conjunto de pessoas já recebidas

**Método**: `jaRecebeuPessoaNoHistorico(nomeIntercessor, nomePessoa, historico, totalPessoas, campoNome) -> boolean`

### 3.5 Regra 5: Limite Máximo de Nomes por Intercessor

**Descrição**: Cada intercessor tem um limite máximo de nomes (padrão: 3). Quando todos atingem o limite, pode-se flexibilizar para um limite maior (padrão: 5).

**Validações**:
- **Limite Normal**: `prayerList.length < maxPorIntercessor`
- **Limite Flexível**: Aplicado apenas quando TODOS os intercessores atingiram o limite normal
  - Verificar: `todos os intercessores têm prayerList.length >= maxPorIntercessor`
  - Se sim: permitir até `limiteFlexivel`

**Métodos**:
- `podeReceberMaisNomes(distribuicaoIntercessor, maxPorIntercessor) -> boolean`
- `podeFlexibilizarLimite(distribuicaoCompleta, maxPorIntercessor) -> boolean`
- `podeReceberMaisNomesFlexivel(distribuicaoIntercessor, maxPorIntercessor, distribuicaoCompleta, limiteFlexivel) -> boolean`

### 3.6 Regra 6: Distribuição Justa (Priorização por Histórico)

**Descrição**: Intercessores que oraram por menos pessoas no histórico têm prioridade na distribuição.

**Aplicação**:
- Usado nas rodadas de adultos (2ª e 3ª rodadas)
- Usado na distribuição flexível (4ª rodada)
- Ordenar intercessores por: `(historySets.get(nomeIntercessor) || new Set()).size` (crescente)

**Método**: `ordenarPorHistoricoGeral(distribuicao, historySets, campoNome) -> Array`

### 3.7 Regra 7: Reinício de Ciclo com Reset de Histórico

**Descrição**: Quando um intercessor completa o ciclo (orou por todas as pessoas exceto ele mesmo), seu histórico é limpo automaticamente.

**Condição de Reset**:
- `contagemUnica >= totalAlvosExcluindoSiMesmo`
- Onde:
  - `contagemUnica` = número de pessoas únicas no histórico do intercessor
  - `totalAlvosExcluindoSiMesmo` = total de pessoas - 1

**Ações ao Resetar**:
1. Registrar ciclo completado no arquivo `prayersEndCicle.json`
2. Limpar todo o histórico do intercessor usando `clearHistoryFor()`
3. Atualizar o mapa de histórico em memória para esta execução

**Métodos**:
- `verificarEResetarCiclos(intercessores, conjuntosHistorico, pessoasData, config) -> number` (retorna quantidade de resets)
- `salvarCicloCompletado(intercessorData, campoNome) -> void`
- `limparHistoricoIntercessor(nomeIntercessor, contextKey, campoNome) -> boolean`

### 3.8 Regra 8: Priorização de Crianças por Histórico

**Descrição**: Na distribuição de crianças, priorizar intercessores que nunca receberam crianças ou receberam menos.

**Aplicação**:
- Construir contador de crianças recebidas por intercessor no histórico
- Ordenar intercessores por contador (crescente)
- Distribuir primeiro para quem tem contador menor

**Métodos**:
- `construirContadorCriancas(historico, campoNome, campoTipo) -> Map<string, number>`
- `ordenarPorContadorCriancas(distribuicao, contadorCriancas, campoNome) -> Array`

---

## 4. Algoritmos de Distribuição

### 4.1 Fluxo Principal

```
1. Obter intercessores (INTERCESSOR == true/"SIM"/1)
2. Obter candidatos (todos com NOME preenchido)
3. Separar candidatos: adultos vs crianças
4. Verificar e resetar ciclos completados
5. Construir conjuntos de histórico
6. Executar 4 rodadas de distribuição:
   a) Rodada 1: Distribuição de crianças (2 passadas)
   b) Rodada 2: Distribuição de adultos (2 rodadas)
   c) Rodada 3: Distribuição por histórico (adultos/crianças restantes)
   d) Rodada 4: Distribuição flexível (se necessário)
7. Salvar resultado no histórico
```

### 4.2 Rodada 1: Distribuição de Crianças

**Objetivo**: Distribuir crianças priorizando quem nunca recebeu.

**Algoritmo**:

```
1. Construir contador de crianças por intercessor no histórico
2. Ordenar intercessores por contador (menor primeiro)
3. Embaralhar array de crianças (Fisher-Yates)
4. PRIMEIRA PASSADA:
   Para cada intercessor (ordenado):
     - Se não pode receber mais nomes (limite): pular
     - Se já tem criança: pular
     - Filtrar crianças elegíveis (aplicar regras 2, 3, 4)
     - Se houver elegíveis: atribuir a primeira
5. SEGUNDA PASSADA:
   Filtrar crianças não atribuídas
   Para cada intercessor:
     - Se não pode receber mais nomes (limite): pular
     - Filtrar crianças elegíveis restantes
     - Se houver elegíveis: atribuir a primeira
```

**Método**: `distributeChildren(intercessors, childrenPool, assignedSet, historySets)`

### 4.3 Rodada 2: Distribuição de Adultos (2 Rodadas)

**Objetivo**: Distribuir adultos em 2 rodadas, priorizando por histórico.

**Algoritmo**:

```
Para rodada = 1 até 2:
  1. Ordenar intercessores por histórico geral (menor primeiro)
  2. Embaralhar array de adultos (Fisher-Yates)
  3. Para cada intercessor (ordenado):
     - Se não pode receber mais nomes (limite): pular
     - Filtrar adultos elegíveis (aplicar regras 2, 3, 4)
     - Se houver elegíveis: atribuir o primeiro
```

**Método**: `distributeAdultsRounds(intercessors, adultsPool, assignedSet, historySets, rounds = 2)`

### 4.4 Rodada 3: Distribuição por Histórico

**Objetivo**: Distribuir pessoas restantes (adultos e crianças) priorizando por histórico.

**Algoritmo**:

```
1. Ordenar intercessores por histórico geral (menor primeiro)
2. Embaralhar arrays de adultos e crianças
3. Para cada intercessor (ordenado):
   - Se não pode receber mais nomes (limite): pular
   - Tentar adultos elegíveis primeiro
   - Se não houver adultos, tentar crianças elegíveis
   - Se houver elegíveis: atribuir o primeiro
```

**Método**: `distributeThirdByHistory(intercessors, adultsPool, childrenPool, assignedSet, historySets)`

### 4.5 Rodada 4: Distribuição Flexível

**Objetivo**: Quando todos atingiram o limite, flexibilizar para distribuir pessoas restantes.

**Condições**:
- Há pessoas não distribuídas
- TODOS os intercessores atingiram `maxPorIntercessor`

**Algoritmo**:

```
1. Verificar se pode flexibilizar (todos com limite atingido)
2. Se não pode: retornar
3. Ordenar intercessores por histórico geral (menor primeiro)
4. Embaralhar arrays de adultos e crianças
5. Para cada intercessor (ordenado):
   - Se não pode receber mais nomes (limite flexível): pular
   - Tentar adultos elegíveis primeiro
   - Se não houver adultos, tentar crianças elegíveis
   - Se houver elegíveis: atribuir o primeiro
```

**Método**: `distributeFourthFlexible(intercessors, adultsPool, childrenPool, assignedSet, historySets, totalCandidates)`

### 4.6 Sistema de Múltiplas Tentativas

**Objetivo**: Tentar múltiplas vezes a distribuição para maximizar a taxa de distribuição.

**Algoritmo**:

```
1. Inicializar melhorResultado = null, melhorDistribuicao = 0
2. Para tentativa = 1 até maxTentativas:
   a) Executar generateDistributionSingle()
   b) Calcular taxaDistribuicao = distribuidas / totalCandidates
   c) Se taxaDistribuicao == 1.0 (100%): salvar e retornar
   d) Se distribuidas > melhorDistribuicao: atualizar melhor
   e) Se não é última tentativa:
      - Executar reset antecipado para próxima tentativa
3. Retornar melhorResultado
```

**Método**: `generateDistributionWithRetries(intercessorsRaw, candidatesRaw, totalCandidates)`

### 4.7 Reset Antecipado

**Objetivo**: Resetar intercessores próximos de completar o ciclo para melhorar distribuição.

**Condições de Ativação**:
- `resetAntecipado.habilitado == true`
- Taxa de distribuição < `limiteDistribuicao` (ou sempre se configurado)
- Há pessoas não distribuídas

**Algoritmo**:

```
1. Encontrar intercessores próximos do fim:
   - Para cada intercessor:
     - contagemUnica = histórico.size
     - restantes = totalAlvos - 1 - contagemUnica
     - Se restantes > 0 e restantes <= limiteProximidade: adicionar à lista
   - Ordenar por restantes (menor primeiro)

2. Determinar quantidade para resetar:
   - Se tipo == 'fixo': quantidadeParaReset = min(quantidade, candidatos.length)
   - Se tipo == 'dinamico': quantidadeParaReset = min(ceil(pessoasNaoDistribuidas / 2), candidatos.length)
   - Se tipo == 'proporcional': quantidadeParaReset = max(1, floor(candidatos.length * quantidade))

3. Resetar os N primeiros:
   - Para cada intercessor selecionado:
     - Registrar reset antecipado
     - Limpar histórico do intercessor
     - Atualizar mapa de histórico em memória
```

**Métodos**:
- `encontrarIntercessoresMaisProximosDoFim(intercessores, conjuntosHistorico, totalAlvos, config) -> Array`
- `determinarQuantidadeParaReset(proximosDoFim, config, pessoasNaoDistribuidas) -> number`
- `executarResetAntecipado(intercessoresParaReset, conjuntosHistorico, config, motivo) -> number`

---

## 5. Gerenciamento de Histórico

### 5.1 Estrutura de Armazenamento

**Localização**: Diretório `data/history/`

**Arquivos**:
- `{contextKey}.json`: Histórico principal de distribuições
- `prayersEndCicle.json`: Registro de ciclos completados e resets antecipados

**Formato**: JSON com estrutura `{ "YYYY-MM-DD": [array de distribuições] }`

### 5.2 Operações do HistoryManager

#### 5.2.1 Salvar Histórico

**Método**: `save(context, data, uniqueKeys = [])`

**Comportamento**:
1. Ler arquivo existente ou criar novo
2. Obter data atual (ISO: YYYY-MM-DD)
3. Se data não existe no histórico: criar array vazio
4. Para cada item em `data`:
   - Se `uniqueKeys` fornecido: verificar duplicatas na data atual
   - Se não duplicado: adicionar ao array da data
5. Se array da data ficou vazio: remover a data
6. Salvar arquivo JSON

**Validação de Duplicatas**:
- Comparar todos os campos em `uniqueKeys` entre item novo e existentes
- Se todos os campos coincidem: item é duplicado

#### 5.2.2 Ler Histórico

**Método**: `read(context) -> object | null`

**Comportamento**:
1. Verificar se arquivo existe
2. Se não existe: retornar `null`
3. Ler e fazer parse do JSON
4. Retornar objeto completo ou lançar exceção se corrompido

#### 5.2.3 Limpar Histórico de Item Específico

**Método**: `clearHistoryFor(context, item, uniqueKeys = []) -> boolean`

**Comportamento**:
1. Ler arquivo existente
2. Para cada data no histórico:
   - Filtrar entradas que NÃO correspondem ao item (usando `uniqueKeys`)
   - Se array da data ficou vazio: remover a data
3. Se houve alteração: salvar arquivo
4. Retornar `true` se houve alteração, `false` caso contrário

#### 5.2.4 Verificar Duplicata

**Método**: `isDuplicated(context, item, uniqueKeys = []) -> boolean`

**Comportamento**:
1. Ler histórico
2. Verificar se existe na data atual
3. Comparar usando `uniqueKeys`
4. Retornar `true` se duplicado

#### 5.2.5 Verificar se Já Foi Enviado

**Método**: `wasEverSent(context, item, uniqueKeys = []) -> boolean`

**Comportamento**:
1. Ler histórico completo
2. Verificar em TODAS as datas (não apenas hoje)
3. Comparar usando `uniqueKeys`
4. Retornar `true` se encontrado em qualquer data

### 5.3 Construção de Conjuntos de Histórico

**Método**: `construirConjuntosHistorico(historico, campoNome) -> Map<string, Set<string>>`

**Objetivo**: Criar mapa eficiente de intercessor -> conjunto de pessoas já recebidas.

**Algoritmo**:

```
1. Criar Map vazio
2. Para cada data no histórico:
   Para cada entrada na data:
     - nomeInter = entrada[campoNome]
     - Se nomeInter não existe no Map: criar Set vazio
     - Para cada pessoa em entrada.prayerList:
       - Adicionar pessoa[campoNome] ao Set do intercessor
3. Retornar Map
```

**Estrutura Resultante**:
```
Map {
  "Intercessor1" => Set { "Pessoa1", "Pessoa2", "Pessoa3" },
  "Intercessor2" => Set { "Pessoa4", "Pessoa5" }
}
```

---

## 6. Configurações

### 6.1 Valores Padrão

```typescript
{
  contextKey: "prayer",
  campoIntercessor: "intercessor",
  campoNome: "nome",
  campoTelefone: "numero",
  campoTipo: "type",
  maxPorIntercessor: 3,
  maxCriancasPorIntercessor: 1,
  limiteFlexivel: 5,
  resetAntecipado: {
    habilitado: false,
    tipo: 'fixo',
    quantidade: 3,
    limiteProximidade: 30,
    limiteDistribuicao: 0.9,
    maxTentativas: 1,
    tentativasHabilitadas: false
  }
}
```

### 6.2 Exemplo de Configuração em Produção

```typescript
{
  contextKey: "prayer",
  campoIntercessor: "INTERCESSOR",
  campoNome: "NOME",
  campoTelefone: "CELULAR",
  campoTipo: "TIPO",
  maxPorIntercessor: 3,
  maxCriancasPorIntercessor: 1,
  limiteFlexivel: 4,
  resetAntecipado: {
    habilitado: true,
    tipo: 'proporcional',
    quantidade: 0.4,  // 40% dos candidatos próximos
    limiteProximidade: 30,
    limiteDistribuicao: 1.0,  // Sempre tentar melhorar
    maxTentativas: 3,
    tentativasHabilitadas: true
  }
}
```

### 6.3 Tipos de Reset Antecipado

#### 6.3.1 Fixo
- Reseta sempre `quantidade` intercessores (ou menos se não houver candidatos suficientes)
- Exemplo: `quantidade: 3` → sempre reseta 3 intercessores

#### 6.3.2 Dinâmico
- Calcula baseado em pessoas não distribuídas
- Fórmula: `min(ceil(pessoasNaoDistribuidas / 2), candidatos.length)`
- Exemplo: 10 não distribuídas → reseta 5 intercessores

#### 6.3.3 Proporcional
- Reseta percentual dos candidatos próximos
- `quantidade` deve estar entre 0 e 1
- Fórmula: `max(1, floor(candidatos.length * quantidade))`
- Exemplo: `quantidade: 0.4`, 10 candidatos → reseta 4 intercessores

---

## 7. Fluxos de Execução

### 7.1 Fluxo Principal (Sem Múltiplas Tentativas)

```
generateDistribution()
  ↓
generateDistributionSingle()
  ↓
1. Obter intercessores e candidatos
2. Separar adultos/crianças
3. Verificar e resetar ciclos
4. Construir conjuntos de histórico
5. Rodada 1: distributeChildren()
6. Rodada 2: distributeAdultsRounds(rounds=2)
7. Rodada 3: distributeThirdByHistory()
8. Rodada 4: distributeFourthFlexible()
  ↓
Salvar resultado
  ↓
Retornar distribuição
```

### 7.2 Fluxo com Múltiplas Tentativas

```
generateDistribution()
  ↓
generateDistributionWithRetries()
  ↓
Para tentativa = 1 até maxTentativas:
  ├─ generateDistributionSingle()
  ├─ Calcular taxa de distribuição
  ├─ Se 100%: salvar e retornar
  ├─ Atualizar melhor resultado
  └─ Se não última: executarResetParaProximaTentativa()
      ├─ encontrarIntercessoresMaisProximosDoFim()
      ├─ determinarQuantidadeParaReset()
      └─ executarResetAntecipado()
  ↓
Retornar melhor resultado
```

### 7.3 Fluxo de Verificação de Ciclos

```
verificarEResetarCiclos()
  ↓
Para cada intercessor:
  ├─ Calcular contagemUnica (histórico.size)
  ├─ Calcular totalAlvosExcluindoSiMesmo
  ├─ Se contagemUnica >= totalAlvosExcluindoSiMesmo:
  │   ├─ salvarCicloCompletado()
  │   ├─ limparHistoricoIntercessor()
  │   └─ Atualizar mapa em memória
  └─ Incrementar contador de resets
  ↓
Retornar quantidade de resets
```

### 7.4 Fluxo de Filtragem de Elegíveis

```
getEligibleTargets()
  ↓
Para cada candidato no pool:
  ├─ Regra 2: podeOrarPorPessoa()? → Se não: remover
  ├─ Regra 3: jaFoiAtribuidoNaSemana()? → Se sim: remover
  └─ Regra 4: jaRecebeuPessoaNoHistorico()? → Se sim: remover
  ↓
Se preferType especificado:
  └─ Ordenar por tipo (preferType primeiro)
  ↓
Retornar lista filtrada e ordenada
```

---

## 8. Validações e Tratamento de Erros

### 8.1 Validações de Entrada

#### 8.1.1 Dados de Entrada
- **Intercessores**: Deve haver pelo menos 1 intercessor
  - Erro: `"Nenhum intercessor encontrado na lista"`
- **Candidatos**: Deve haver pelo menos 1 candidato
  - Erro: `"Nenhuma pessoa para receber oração encontrada"`

#### 8.1.2 Identificação de Intercessor
Valores aceitos (case-sensitive para strings):
- `true` (boolean)
- `"SIM"` (string)
- `"sim"` (string)
- `1` (number)

#### 8.1.3 Identificação de Criança
Valores aceitos (case-insensitive):
- `"crianca"`
- `"criança"`
- `"CRIANÇA"`
- `"Criança"`

### 8.2 Tratamento de Erros de Histórico

#### 8.2.1 Arquivo Corrompido
- **Comportamento**: Recriar arquivo vazio e continuar
- **Log**: `"Histórico de {context} estava corrompido, já foi recriado e o dado salvo."`

#### 8.2.2 Falha ao Limpar Histórico
- **Comportamento**: Logar warning e continuar
- **Log**: `"⚠️ Falha ao limpar histórico para: {nomeIntercessor}"`

### 8.3 Validações de Configuração

#### 8.3.1 Tipo de Reset Inválido
- **Comportamento**: Usar valor fixo como fallback
- **Log**: `"⚠️ Tipo de reset antecipado inválido: {tipo}. Usando valor fixo."`

#### 8.3.2 Valores de Configuração
- `maxPorIntercessor`: Deve ser > 0
- `limiteFlexivel`: Deve ser >= `maxPorIntercessor`
- `quantidade` (proporcional): Deve estar entre 0 e 1
- `maxTentativas`: Deve ser >= 1

---

## 9. Considerações para Implementação Java/Angular

### 9.1 Estrutura de Classes Java

#### 9.1.1 Entidades

```java
// Pessoa.java
public class Pessoa {
    private String nome;
    private String celular;
    private String tipo;
    private Boolean intercessor;
    private String nomePai;
    private String telefonePai;
    private String nomeMae;
    private String telefoneMae;
    private List<Responsavel> responsaveis;
    // getters/setters
}

// Responsavel.java
public class Responsavel {
    private ResponsavelPai pai;
    private ResponsavelMae mae;
    // getters/setters
}

// IntercessorDistribuicao.java
public class IntercessorDistribuicao {
    private String nome;
    private String telefone;
    private List<PessoaDistribuida> prayerList;
    // getters/setters
}

// Config.java
public class Config {
    private String contextKey;
    private String campoIntercessor;
    private String campoNome;
    private String campoTelefone;
    private String campoTipo;
    private Integer maxPorIntercessor;
    private Integer maxCriancasPorIntercessor;
    private Integer limiteFlexivel;
    private ResetAntecipadoConfig resetAntecipado;
    // getters/setters
}
```

#### 9.1.2 Serviços

```java
// PrayerRulesService.java
@Service
public class PrayerRulesService {
    private PrayerRules rules;
    private HistoryManager historyManager;
    
    public List<IntercessorDistribuicao> generateDistribution(
        List<Pessoa> data, 
        Config config
    ) { ... }
}

// PrayerRules.java
@Component
public class PrayerRules {
    // Todas as regras de negócio
    public boolean podeOrarPorPessoa(String nomeIntercessor, String nomePessoa) { ... }
    public boolean jaFoiAtribuidoNaSemana(String nomePessoa, Set<String> atribuidos) { ... }
    // ... outras regras
}

// HistoryManager.java
@Service
public class HistoryManager {
    private String historyDir = "data/history/";
    
    public void save(String context, Object data, List<String> uniqueKeys) { ... }
    public Map<String, List<Object>> read(String context) { ... }
    public boolean clearHistoryFor(String context, Map<String, Object> item, List<String> keys) { ... }
}
```

### 9.2 Estrutura Angular (Frontend)

#### 9.2.1 Modelos TypeScript

```typescript
// models/pessoa.model.ts
export interface Pessoa {
  NOME: string;
  CELULAR?: string;
  TIPO: string;
  INTERCESSOR: boolean | string;
  NOMEPAI?: string;
  TELEFONEPAI?: string;
  NOMEMAE?: string;
  TELEFONEMAE?: string;
  responsavel?: Responsavel[];
}

// models/config.model.ts
export interface Config {
  contextKey: string;
  campoIntercessor: string;
  campoNome: string;
  campoTelefone: string;
  campoTipo: string;
  maxPorIntercessor: number;
  maxCriancasPorIntercessor: number;
  limiteFlexivel: number;
  resetAntecipado: ResetAntecipadoConfig;
}
```

#### 9.2.2 Serviços Angular

```typescript
// services/prayer-rules.service.ts
@Injectable({ providedIn: 'root' })
export class PrayerRulesService {
  constructor(private http: HttpClient) {}
  
  generateDistribution(data: Pessoa[], config: Config): Observable<IntercessorDistribuicao[]> {
    return this.http.post<IntercessorDistribuicao[]>('/api/prayer/distribute', {
      data,
      config
    });
  }
}
```

### 9.3 Algoritmos e Estruturas de Dados

#### 9.3.1 Embaralhamento (Fisher-Yates)

**Java**:
```java
public <T> List<T> embaralharArray(List<T> array) {
    List<T> resultado = new ArrayList<>(array);
    Random random = new Random();
    for (int i = resultado.size() - 1; i > 0; i--) {
        int j = random.nextInt(i + 1);
        Collections.swap(resultado, i, j);
    }
    return resultado;
}
```

**TypeScript**:
```typescript
embaralharArray<T>(array: T[]): T[] {
  const resultado = [...array];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }
  return resultado;
}
```

#### 9.3.2 Estruturas de Dados

**Java**:
- `Set<String>` para `assignedSet` e `historySets`
- `Map<String, Set<String>>` para `historySets`
- `Map<String, Integer>` para contadores

**TypeScript**:
- `Set<string>` para `assignedSet` e `historySets`
- `Map<string, Set<string>>` para `historySets`
- `Map<string, number>` para contadores

### 9.4 Persistência de Histórico

#### 9.4.1 Java (Backend)

**Opções**:
1. **Arquivos JSON** (igual ao original)
   - Usar `Jackson` ou `Gson` para serialização
   - `java.nio.file.Files` para leitura/escrita

2. **Banco de Dados**
   - Tabela `prayer_history` com colunas: `date`, `context`, `data` (JSON)
   - Usar JPA/Hibernate

**Exemplo com Arquivo**:
```java
@Service
public class HistoryManager {
    private final Path historyDir = Paths.get("data/history");
    
    public void save(String context, Object data, List<String> uniqueKeys) {
        Path filePath = historyDir.resolve(context + ".json");
        // Implementar lógica similar ao JavaScript
    }
}
```

#### 9.4.2 Angular (Frontend)

- Histórico gerenciado no backend
- Frontend apenas consome API REST
- Cache local opcional com `localStorage` ou `IndexedDB`

### 9.5 APIs REST Sugeridas

```java
// PrayerController.java
@RestController
@RequestMapping("/api/prayer")
public class PrayerController {
    
    @PostMapping("/distribute")
    public ResponseEntity<List<IntercessorDistribuicao>> distribute(
        @RequestBody DistributionRequest request
    ) {
        // Implementar
    }
    
    @GetMapping("/history/{context}")
    public ResponseEntity<Map<String, List<Object>>> getHistory(
        @PathVariable String context
    ) {
        // Implementar
    }
    
    @DeleteMapping("/history/{context}")
    public ResponseEntity<Void> clearHistory(
        @PathVariable String context,
        @RequestBody Map<String, Object> item
    ) {
        // Implementar
    }
}
```

### 9.6 Testes Unitários Essenciais

#### 9.6.1 Regras de Negócio

```java
@Test
void testPodeOrarPorPessoa_NaoPodeOrarPorSiMesmo() {
    assertFalse(rules.podeOrarPorPessoa("João", "João"));
    assertTrue(rules.podeOrarPorPessoa("João", "Maria"));
}

@Test
void testJaFoiAtribuidoNaSemana() {
    Set<String> atribuidos = new HashSet<>(Arrays.asList("Maria"));
    assertTrue(rules.jaFoiAtribuidoNaSemana("Maria", atribuidos));
    assertFalse(rules.jaFoiAtribuidoNaSemana("João", atribuidos));
}
```

#### 9.6.2 Algoritmos de Distribuição

```java
@Test
void testDistributeChildren_PriorizaQuemNuncaRecebeu() {
    // Setup: 2 intercessores, 2 crianças
    // Intercessor1 nunca recebeu, Intercessor2 já recebeu 1
    // Verificar que Intercessor1 recebe primeiro
}
```

### 9.7 Performance e Otimizações

#### 9.7.1 Otimizações Java

1. **Cache de Histórico**: Usar `@Cacheable` para histórico lido frequentemente
2. **Streams Paralelos**: Para processamento de grandes volumes
3. **Lazy Loading**: Carregar histórico apenas quando necessário

#### 9.7.2 Otimizações Angular

1. **OnPush Change Detection**: Para componentes de listagem
2. **Virtual Scrolling**: Para listas grandes de intercessores
3. **Lazy Loading**: Carregar módulos sob demanda

---

## 10. Exemplos Práticos

### 10.1 Exemplo Completo de Uso

**Entrada**:
```json
{
  "data": [
    { "NOME": "João", "TIPO": "adulto", "INTERCESSOR": "SIM", "CELULAR": "11999999999" },
    { "NOME": "Maria", "TIPO": "adulto", "INTERCESSOR": false, "CELULAR": "11888888888" },
    { "NOME": "Pedro", "TIPO": "crianca", "INTERCESSOR": false, "CELULAR": "11777777777" }
  ],
  "config": {
    "contextKey": "prayer",
    "campoIntercessor": "INTERCESSOR",
    "campoNome": "NOME",
    "campoTelefone": "CELULAR",
    "campoTipo": "TIPO",
    "maxPorIntercessor": 3,
    "maxCriancasPorIntercessor": 1,
    "limiteFlexivel": 4
  }
}
```

**Saída**:
```json
[
  {
    "NOME": "João",
    "CELULAR": "11999999999",
    "prayerList": [
      { "NOME": "Maria", "TIPO": "adulto", "CELULAR": "11888888888" },
      { "NOME": "Pedro", "TIPO": "crianca", "CELULAR": "11777777777" }
    ]
  }
]
```

### 10.2 Exemplo de Reset de Ciclo

**Situação**: Intercessor "João" já orou por todas as 99 pessoas (exceto ele mesmo) em distribuições anteriores.

**Comportamento**:
1. Sistema detecta: `contagemUnica (99) >= totalAlvosExcluindoSiMesmo (99)`
2. Registra ciclo completado em `prayersEndCicle.json`
3. Limpa todo o histórico de "João"
4. "João" pode receber qualquer pessoa novamente

### 10.3 Exemplo de Reset Antecipado

**Situação**: 
- 100 pessoas totais
- 10 pessoas não distribuídas
- Intercessor "João" tem 70 pessoas no histórico (faltam 29)
- Config: `tipo: 'proporcional'`, `quantidade: 0.4`, `limiteProximidade: 30`

**Comportamento**:
1. Sistema identifica "João" como próximo do fim (29 <= 30)
2. Se há 5 candidatos próximos: reseta `max(1, floor(5 * 0.4)) = 2` intercessores
3. Reseta histórico de "João" e outro intercessor
4. Próxima tentativa terá mais opções de distribuição

---

## 11. Checklist de Implementação

### 11.1 Backend (Java)

- [ ] Criar entidades (Pessoa, Config, IntercessorDistribuicao)
- [ ] Implementar PrayerRules (todas as 8 regras)
- [ ] Implementar PrayerRulesService (algoritmos de distribuição)
- [ ] Implementar HistoryManager (persistência)
- [ ] Criar APIs REST
- [ ] Implementar validações de entrada
- [ ] Implementar tratamento de erros
- [ ] Criar testes unitários para regras
- [ ] Criar testes de integração para distribuição
- [ ] Documentar APIs (Swagger/OpenAPI)

### 11.2 Frontend (Angular)

- [ ] Criar modelos TypeScript
- [ ] Criar serviços para comunicação com API
- [ ] Criar componentes de visualização
- [ ] Implementar formulário de configuração
- [ ] Implementar visualização de distribuição
- [ ] Implementar visualização de histórico
- [ ] Adicionar tratamento de erros
- [ ] Adicionar loading states
- [ ] Implementar testes unitários
- [ ] Implementar testes E2E

### 11.3 Validações Finais

- [ ] Todas as 8 regras implementadas corretamente
- [ ] Sistema de múltiplas tentativas funcionando
- [ ] Reset antecipado funcionando
- [ ] Histórico persistindo corretamente
- [ ] Ciclos sendo resetados automaticamente
- [ ] Distribuição justa sendo aplicada
- [ ] Limites sendo respeitados
- [ ] Flexibilização funcionando quando necessário

---

## 12. Notas Finais

### 12.1 Pontos de Atenção

1. **Case Sensitivity**: 
   - Nomes de pessoas: case-sensitive
   - Tipos (criança): case-insensitive
   - Valores de intercessor: case-sensitive para strings

2. **Embaralhamento**: 
   - Sempre usar Fisher-Yates para garantir aleatoriedade justa
   - Não usar `Collections.shuffle()` sem seed fixo (pode ser previsível)

3. **Performance**:
   - Usar `Set` e `Map` para consultas O(1)
   - Evitar loops aninhados desnecessários
   - Cachear histórico quando possível

4. **Thread Safety** (Java):
   - Se histórico for compartilhado entre threads, usar `ConcurrentHashMap`
   - Considerar locks para escrita de arquivos

### 12.2 Extensões Futuras

- Suporte a múltiplos contextos simultâneos
- Dashboard de métricas de distribuição
- Exportação de relatórios
- Notificações automáticas
- API de webhooks para eventos

---

**Documento gerado em**: 2024
**Versão**: 1.0
**Autor**: Especificação baseada no código fonte do sistema PrayRules

