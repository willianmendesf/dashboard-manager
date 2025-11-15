# 📋 Sistema Oração360 - Regras de Negócio
## 🎯 Objetivo do Sistema
O Sistema Oração360 é responsável por distribuir **automaticamente** os nomes de pessoas para intercessores orarem, garantindo que todos recebam oração de forma justa e organizada, sem repetições desnecessárias e seguindo regras específicas da igreja.
---
## 👥 Conceitos Básicos
### **Intercessor**
- Pessoa que ora por outras pessoas
- Marcada como "SIM" na coluna "INTERCESSOR" da planilha
- Pode receber até 3 nomes por semana para orar
### **Candidato a Receber Oração**
- Qualquer pessoa da lista (incluindo os próprios intercessores)
- Podem ser adultos ou crianças
- Todos devem receber oração de alguém
### **Ciclo Completo**
- Quando um intercessor já orou por todas as outras pessoas da lista
- Ao completar um ciclo, o histórico é zerado e um novo ciclo começa
---
## 📜 As 8 Regras Principais
### **Regra 1: Limite de Crianças 🧒**
> *Cada intercessor recebe no máximo 1 criança por semana (quando possível)*
**Como funciona:**
- Prioridade para distribuir crianças antes dos adultos
- Se sobrar crianças após todos receberem 1, pode distribuir mais
**Exemplo:**
```
✅ João recebe: 1 criança + 2 adultos❌ João NÃO pode receber: 2 crianças + 1 adulto (na primeira rodada)```
---
### **Regra 2: Não Orar por Si Mesmo 🚫**
> *Um intercessor nunca recebe seu próprio nome para orar*
**Como funciona:**
- Sistema automaticamente exclui o próprio nome da lista de candidatos
**Exemplo:**
```
✅ Maria pode orar por: João, Pedro, Ana...❌ Maria NÃO pode orar por: Maria (ela mesma)```
---
### **Regra 3: Unicidade Semanal 📅**
> *Cada pessoa aparece apenas uma vez por semana na distribuição*
**Como funciona:**
- Uma vez que "João" foi atribuído a alguém, ele não aparece mais naquela semana
**Exemplo:**
```
Segunda-feira:
✅ Maria ora por João❌ Pedro NÃO pode receber João (já foi distribuído)```
---
### **Regra 4: Não Repetir Até Completar Ciclo 🔄**
> *Um intercessor não recebe a mesma pessoa duas vezes até completar o ciclo*
**Como funciona:**
- Sistema mantém histórico de quem cada intercessor já orou
- Só repete nomes após o intercessor completar todo o ciclo
**Exemplo:**
```
Maria já orou por: João, Pedro, Ana (50 pessoas no total)
Restam: 159 pessoas que Maria ainda não orou
✅ Maria pode receber: qualquer uma das 159 restantes❌ Maria NÃO pode receber: João, Pedro ou Ana (até completar ciclo)```
---
### **Regra 5: Máximo de 3 Nomes por Intercessor 📊**
> *Cada intercessor recebe no máximo 3 nomes por semana*
**Como funciona:**
- Limite flexível: se todos já receberam 3 e ainda sobram nomes, pode distribuir mais
- Objetivo é equilibrar a carga de oração
**Exemplo:**
```
✅ João recebe: Maria, Pedro, Ana (3 nomes) ✅
⚠️ Se sobrar nomes: João pode receber mais❌ João não recebe 4º nome se outros ainda podem receber```
---
### **Regra 6: Distribuição Justa 📈**
> *Quem orou por menos pessoas no histórico recebe prioridade*
**Como funciona:**
- Sistema conta quantas pessoas únicas cada intercessor já orou
- Quem tem menor contagem recebe nomes primeiro
**Exemplo:**
```
Histórico atual:
- Júlia: orou por 40 pessoas → PRIORIDADE 1 ⭐
- William: orou por 139 pessoas → PRIORIDADE 2
- João: orou por 182 pessoas → PRIORIDADE 3
Na próxima distribuição: Júlia recebe nomes antes dos outros
```
---
### **Regra 7: Reset de Ciclo 🔄**
> *Quando completa o ciclo, zera histórico e registra a conquista*
**Como funciona:**
- Quando intercessor ora por todas as 209 pessoas possíveis (210 total - ele mesmo)
- Histórico é zerado completamente
- Registro é salvo no arquivo `prayersEndCicle.json`
- Novo ciclo começa imediatamente
**Exemplo:**
```
João completou ciclo: orou por 209/209 pessoas ✅
📝 Registrado em prayersEndCicle.json com data🗑️ Histórico de João é zerado🔄 João pode receber qualquer nome novamente```
---
### **Regra 8: Priorização de Crianças 👶**
> *Quem nunca recebeu criança tem prioridade*
**Como funciona:**
- Sistema conta quantas crianças cada intercessor já recebeu no histórico
- Quem nunca recebeu ou recebeu menos, tem prioridade
**Exemplo:**
```
Histórico de crianças:
- Maria: 0 crianças → PRIORIDADE 1 ⭐
- João: 2 crianças → PRIORIDADE 2
- Pedro: 5 crianças → PRIORIDADE 3
Maria recebe criança antes de João e Pedro
```
---
## 🔄 Fluxo de Distribuição
### **1. Verificação de Ciclos**
```
🔍 Verificando ciclo de cada intercessor🔄 Se completou 209 pessoas → Reset automático📝 Registro no prayersEndCicle.json```
### **2. Distribuição de Crianças**
```
👶 Prioridade: quem nunca recebeu criança🧒 Máximo: 1 criança por intercessor (1ª rodada)🔄 Sobras: distribuir crianças restantes```
### **3. Distribuição de Adultos (2 Rodadas)**
```
📋 Rodada 1: Priorização por histórico geral👨 Quem orou por menos pessoas recebe primeiro📋 Rodada 2: Mesma lógica```
### **4. Distribuição Final (3ª Rodada)**
```
🎯 Prioridade: quem tem menos pessoas no histórico🔀 Adultos primeiro, depois crianças restantes📊 Objetivo: maximizar distribuição```
### **5. Reset Antecipado (Opcional)**
```
📉 Detecta distribuição baixa por restrições🔍 Identifica intercessores próximos do fim do ciclo🔄 Reset antecipado para melhorar distribuição📈 Nova tentativa de distribuição completa```
---
## ⚙️ Configurações de Reset Antecipado

### **Habilitação**
O reset antecipado é **opcional** e deve ser habilitado via configuração:
```javascript
resetAntecipado: {
  habilitado: true, // false = desabilitado
  // ... outras configurações
}
```

### **Tipos de Reset**
#### **1. Fixo**
```javascript
tipo: 'fixo',
quantidade: 3 // Sempre reseta exatamente 3 intercessores
```
**Como funciona:**
- Sempre reseta o **número exato** especificado em `quantidade`
- **Previsível**: Independente da situação, sempre reseta a mesma quantidade
- **Simples**: Ideal quando você quer controle total sobre quantos resets fazer

**Exemplo:**
```
Situação: 200/210 pessoas distribuídas (10 não distribuídas)
Configuração: tipo: 'fixo', quantidade: 3
Resultado: Sempre reseta exatamente 3 intercessores
```

#### **2. Dinâmico**
```javascript
tipo: 'dinamico',
// Quantidade baseada em pessoas não distribuídas
// Se 10 pessoas não foram distribuídas → reseta ~5 intercessores
```
**Como funciona:**
- **Calcula automaticamente** quantos resetar baseado nas pessoas não distribuídas
- **Fórmula**: `Math.ceil(pessoasNaoDistribuidas / 2)`
- **Inteligente**: Mais pessoas não distribuídas = mais resets
- **Adaptativo**: Se ajusta à situação atual

**Exemplos:**
```
📊 10 pessoas não distribuídas → Reseta 5 intercessores
📊 6 pessoas não distribuídas → Reseta 3 intercessores  
📊 30 pessoas não distribuídas → Reseta 15 intercessores
📊 1 pessoa não distribuída → Reseta 1 intercessor
```

#### **3. Proporcional**
```javascript
tipo: 'proporcional',
quantidade: 25 // 25% dos candidatos próximos do fim
```
**Como funciona:**
- **Percentual** dos intercessores que estão próximos de completar o ciclo
- **Fórmula**: `Math.floor(candidatosProximos * (quantidade/100))`
- **Flexível**: Se adapta ao número de candidatos disponíveis
- **Balanceado**: Garante que não resete todos os próximos

**Exemplos:**
```
📊 20 candidatos próximos + 25% → Reseta 5 intercessores (25% de 20)
📊 8 candidatos próximos + 50% → Reseta 4 intercessores (50% de 8)
📊 12 candidatos próximos + 33% → Reseta 3 intercessores (33% de 12)
```

### **Configurações Avançadas**
```javascript
resetAntecipado: {
  habilitado: true,
  tipo: 'fixo',
  quantidade: 3,
  limiteProximidade: 30, // Considera "próximo" se faltam ≤30 pessoas
  limiteDistribuicao: 0.9 // Ativa se distribuição < 90%
}
```

#### **limiteProximidade**
**O que é:**
- Define quantos nomes podem faltar para considerar um intercessor "próximo do fim"
- Só intercessores próximos o suficiente são candidatos ao reset

**Exemplos:**
```
limiteProximidade: 30
✅ João: faltam 15 pessoas → CANDIDATO (15 ≤ 30)
✅ Maria: faltam 28 pessoas → CANDIDATA (28 ≤ 30)  
❌ Pedro: faltam 45 pessoas → NÃO CANDIDATO (45 > 30)
```

#### **limiteDistribuicao**
**O que é:**
- Taxa mínima de distribuição para NÃO ativar o reset
- Se a distribuição ficar abaixo deste limite, o reset é ativado

**Exemplos:**
```
limiteDistribuicao: 0.9 (90%)
📈 195/210 pessoas (92.9%) → Reset NÃO ativado ✅
📉 180/210 pessoas (85.7%) → Reset ativado ⚠️
📉 200/210 pessoas (95.2%) → Reset NÃO ativado ✅
```

### **Critérios de Ativação**
O reset antecipado é ativado quando **TODAS** as condições são atendidas:
- ✅ Está **habilitado** na configuração
- ✅ Taxa de distribuição está **abaixo do limite** (ex: <90%)
- ✅ Existem intercessores **próximos do fim** do ciclo
- ✅ Há **pessoas não distribuídas** por restrições

### **Processo de Reset Antecipado**
```
1. 📊 Sistema tenta distribuição normal
2. 📉 Detecta distribuição baixa (ex: 85% vs limite 90%)
3. 🔍 Identifica intercessores com poucos nomes restantes
4. 📊 Calcula quantidade ideal para resetar (baseado no tipo)
5. 🎯 Seleciona os mais próximos do fim
6. 🔄 Executa reset dos selecionados
7. 📝 Registra reset antecipado no prayersEndCicle.json
8. 🔄 Redistribui todos os nomes novamente
9. 📈 Verifica melhoria na distribuição
10. ✅ Garante 100% de distribuição
```

### **Diferenças entre Tipos**

| Tipo | Baseado em | Vantagem | Quando Usar |
|------|------------|----------|-------------|
| **Fixo** | Número fixo | Previsível, controle total | Quando quer sempre o mesmo impacto |
| **Dinâmico** | Pessoas não distribuídas | Adaptativo, inteligente | Para ajuste automático ideal |
| **Proporcional** | % dos candidatos | Balanceado, flexível | Para impacto proporcional |

### **Exemplo de Logs**
```
📉 Distribuição baixa detectada: 85.2% (limite: 90.0%)
🔍 Analisando possibilidade de reset antecipado...
📊 Reset antecipado - Candidatos próximos: 5, Para resetar: 3
🎯 Executando reset antecipado de 3 intercessores
🔄 Reset antecipado para: JOÃO (185/209 pessoas, 88.5% completo)
🔄 Reset antecipado para: MARIA (180/209 pessoas, 86.1% completo)
🔄 Reset antecipado para: PEDRO (178/209 pessoas, 85.2% completo)
📈 Pós-reset antecipado: 210/210 pessoas (100.0%)
✅ Reset antecipado melhorou a distribuição em 14.8 pontos percentuais
```

### **Registro no prayersEndCicle.json**
O sistema diferencia ciclos completados naturalmente vs resets antecipados:

```json
{
  "2025-01-08": [
    {
      "nome": "JOÃO SILVA",
      "tipoReset": "completo"
    },
    {
      "nome": "MARIA SANTOS", 
      "tipoReset": "antecipado",
      "motivo": "distribuição baixa (85.2%)",
      "percentualCompleto": 88.5,
      "timestamp": "2025-01-08T10:30:00.000Z"
    }
  ]
}
```

### **Configurações Recomendadas**

#### **Para Máxima Distribuição (Recomendado)**
```javascript
resetAntecipado: {
  habilitado: true,
  tipo: 'dinamico',
  limiteProximidade: 30,
  limiteDistribuicao: 0.95  // 95% - mais rigoroso
}
```

#### **Para Controle Conservador**
```javascript
resetAntecipado: {
  habilitado: true,
  tipo: 'fixo',
  quantidade: 2,
  limiteProximidade: 20,
  limiteDistribuicao: 0.85  // 85% - menos rigoroso
}
```

#### **Para Desabilitar**
```javascript
resetAntecipado: {
  habilitado: false
  // Comportamento original - permite queda na distribuição
}
```

---

## 🔄 Sistema de Múltiplas Tentativas

### **O que é**
O Sistema de Múltiplas Tentativas é uma funcionalidade avançada que **garante máxima distribuição** tentando redistribuir automaticamente quando não consegue alcançar 100% dos nomes na primeira tentativa.

### **Como Funciona**
```
🎯 Tentativa 1: Distribui normalmente
📊 Se < 100% → Reset antecipado → Nova tentativa
🎯 Tentativa 2: Redistribui com histórico atualizado  
📊 Se < 100% → Reset antecipado → Nova tentativa
🎯 Tentativa 3: Última tentativa
🏁 Usa o melhor resultado obtido
```

### **Configuração**

#### **Configuração Completa (Recomendada)**
```javascript
resetAntecipado: {
  habilitado: true,
  tipo: 'proporcional',
  quantidade: 0.4,                    // 40% dos candidatos próximos
  limiteProximidade: 30,              // Próximo = faltam ≤30 pessoas
  limiteDistribuicao: 1.0,            // Ativa em qualquer queda
  maxTentativas: 3,                   // Máximo 3 tentativas
  tentativasHabilitadas: true         // Liga sistema de múltiplas tentativas
}
```

#### **Sistema Desabilitado (Comportamento Original)**
```javascript
resetAntecipado: {
  habilitado: true,
  // ... outras configurações ...
  tentativasHabilitadas: false        // Desliga múltiplas tentativas
}
```

### **Parâmetros do Sistema de Tentativas**

#### **tentativasHabilitadas**
**O que é:**
- Liga/desliga o sistema de múltiplas tentativas
- Quando `false`, funciona como o sistema original

**Valores:**
```javascript
tentativasHabilitadas: true   // Liga sistema de múltiplas tentativas
tentativasHabilitadas: false  // Comportamento original (1 tentativa)
```

#### **maxTentativas**
**O que é:**
- Define quantas vezes o sistema tentará redistribuir antes de aceitar resultado parcial
- Entre cada tentativa, executa reset antecipado para liberar mais opções

**Valores recomendados:**
```javascript
maxTentativas: 1    // Só uma tentativa (igual ao original)
maxTentativas: 3    // Recomendado - bom equilíbrio
maxTentativas: 5    // Mais agressivo - pode resetar muitos ciclos
```

### **Critérios de Parada**

O sistema para quando **qualquer** condição é atendida:
1. ✅ **100% de distribuição alcançada** → Para imediatamente
2. ✅ **Máximo de tentativas atingido** → Usa melhor resultado
3. ✅ **Sem candidatos para reset** → Usa resultado atual

### **Comportamento Inteligente**

#### **Otimização Automática**
- **Para na primeira tentativa bem-sucedida** (100%)
- **Guarda sempre o melhor resultado** entre todas as tentativas
- **Reset progressivo** entre tentativas para máxima eficiência

#### **Logs Detalhados**
```
🔄 Sistema de múltiplas tentativas habilitado (máximo: 3 tentativas)
🎯 Tentativa 1/3 de distribuição
📊 Tentativa 1: 205/210 pessoas (97.6%)
📈 Novo melhor resultado: 205/210 pessoas
🔄 Preparando reset antecipado para próxima tentativa...
🔧 Executando reset antecipado de 2 intercessores para próxima tentativa
✅ 2 resets executados com sucesso

🎯 Tentativa 2/3 de distribuição
📊 Tentativa 2: 210/210 pessoas (100.0%)
✅ Distribuição completa alcançada na tentativa 2!
```

### **Cenários de Uso**

#### **Cenário 1: Sucesso na 1ª Tentativa**
```
🎯 Tentativa 1: 210/210 pessoas (100.0%)
✅ Distribuição completa alcançada na tentativa 1!
```
**Resultado:** Sistema para imediatamente, nenhum reset desnecessário.

#### **Cenário 2: Melhoria Gradual**
```
🎯 Tentativa 1: 148/210 pessoas (70.5%)
🎯 Tentativa 2: 195/210 pessoas (92.9%)  
🎯 Tentativa 3: 210/210 pessoas (100.0%)
✅ Distribuição completa alcançada na tentativa 3!
```
**Resultado:** Sucesso após resets antecipados progressivos.

#### **Cenário 3: Melhor Esforço**
```
🎯 Tentativa 1: 148/210 pessoas (70.5%)
🎯 Tentativa 2: 195/210 pessoas (92.9%)
🎯 Tentativa 3: 203/210 pessoas (96.7%)
🏁 Finalizando com melhor resultado: 203/210 pessoas (96.7%)
⚠️ Atenção: 7 pessoas não foram distribuídas após 3 tentativas.
```
**Resultado:** Usa o melhor resultado obtido (Tentativa 3).

### **Vantagens do Sistema**

| Aspecto | Sem Múltiplas Tentativas | Com Múltiplas Tentativas |
|---------|-------------------------|--------------------------|
| **Distribuição** | Pode cair para 70-80% | Quase sempre 95-100% |
| **Resets** | Só quando ciclo completa | Preventivos entre tentativas |
| **Controle** | Limitado | Total controle via config |
| **Logs** | Básicos | Detalhados e informativos |
| **Resultado** | Primeira tentativa | Melhor de todas as tentativas |

### **Considerações Importantes**

#### **Impact em Ciclos**
- **Reset antecipado** pode fazer pessoas "perderem" progresso no ciclo
- **Compensação:** Garante que **todos** recebam oração sempre
- **Balanceamento:** Use `maxTentativas` moderado (2-4 tentativas)

#### **Performance**
- Mais tentativas = mais processamento
- Cada tentativa roda toda a lógica de distribuição
- **Recomendação:** 3 tentativas são suficientes na maioria dos casos

#### **Configuração Recomendada para Produção**
```javascript
resetAntecipado: {
  habilitado: true,
  tipo: 'proporcional',
  quantidade: 0.4,
  limiteProximidade: 30,
  limiteDistribuicao: 1.0,
  maxTentativas: 3,
  tentativasHabilitadas: true
}
```

Esta configuração garante:
- ✅ **Distribuição máxima** (quase sempre 100%)
- ✅ **Reset balanceado** (40% dos candidatos)
- ✅ **Limite adequado** (3 tentativas)
- ✅ **Reação imediata** (qualquer queda ativa sistema)
