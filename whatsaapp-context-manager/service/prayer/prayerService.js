const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

const HistoryManager = require("../../utils/HistoryManager");
const PrayerRules = require("./prayerRules");

/**
 * Serviço de distribuição de orações que implementa as regras de negócio
 * usando a classe PrayerRules
 */
class PrayRulesImplementation {
  constructor(data = [], config = {}) {
    this.data = data;
    this.historyManager = new HistoryManager();

    this.config = {
      contextKey: config.contextKey || "prayer",
      campoIntercessor: config.campoIntercessor || "intercessor",
      campoNome: config.campoNome || "nome",
      campoTelefone: config.campoTelefone || "numero",
      campoTipo: config.campoTipo || "type",
      maxPorIntercessor: config.maxPorIntercessor || 3,
      maxCriancasPorIntercessor: config.maxCriancasPorIntercessor || 1,
      limiteFlexivel: config.limiteFlexivel || 5, // Nova configuração para flexibilização

      // Configurações para reset antecipado
      resetAntecipado: {
        habilitado: config.resetAntecipado?.habilitado || false,
        tipo: config.resetAntecipado?.tipo || 'fixo', // 'fixo', 'dinamico', 'proporcional'
        quantidade: config.resetAntecipado?.quantidade || 3, // Número fixo ou percentual para 'proporcional'
        limiteProximidade: config.resetAntecipado?.limiteProximidade || 30, // Quantos nomes restantes para considerar "próximo"
        limiteDistribuicao: config.resetAntecipado?.limiteDistribuicao || 0.9, // 90% - limite para considerar distribuição baixa
        maxTentativas: config.resetAntecipado?.maxTentativas || 1, // Máximo de tentativas de reset
        tentativasHabilitadas: config.resetAntecipado?.tentativasHabilitadas || false // Habilita sistema de múltiplas tentativas
      }
    };

    // Inicializar as regras
    this.endCycleFilePath = path.join(this.historyManager.historyDir, 'prayersEndCicle.json');
    this.rules = new PrayerRules(this.historyManager, this.endCycleFilePath);
  }

  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // ---------- Seleção básica ----------

  getIntercessors() {
    return this.data.filter(p => {
      const intercessorValue = p[this.config.campoIntercessor];
      // Verifica valores possíveis: "SIM", "sim", true, 1
      return intercessorValue === "SIM" ||
             intercessorValue === "sim" ||
             intercessorValue === true ||
             intercessorValue === 1;
    });
  }

  getCandidates() {
    return this.data.filter(p => !!p[this.config.campoNome]);
  }

  // ---------- Histórico ----------

  readHistory() {
    return this.historyManager.read(this.config.contextKey) || {};
  }

  // ---------- Distribuição usando as regras ----------

  distributeChildren(intercessors, childrenPool, assignedSet, historySets) {
    if (!childrenPool.length) return;

    const history = this.readHistory();
    const childCounts = this.rules.construirContadorCriancas(history, this.config.campoNome, this.config.campoTipo);

    // Ordenar por prioridade (quem nunca recebeu criança primeiro)
    const intercessorsByChildCount = this.rules.ordenarPorContadorCriancas(
      intercessors,
      childCounts,
      this.config.campoNome
    );

    const shuffledChildren = this.rules.embaralharArray(childrenPool);

    // 1ª passada: máximo 1 criança por intercessor
    intercessorsByChildCount.forEach(inter => {
      if (!this.rules.podeReceberMaisNomes(inter, this.config.maxPorIntercessor)) return;
      if (this.rules.jaTemCrianca(inter, this.config.campoTipo)) return;

      const interName = inter[this.config.campoNome];
      const eligibleChildren = this.getEligibleTargets(inter, shuffledChildren, assignedSet, historySets, "crianca");

      if (eligibleChildren.length > 0) {
        const pick = eligibleChildren[0];
        inter.prayerList.push(this.rules.formatarParaDistribuicao(
          pick,
          this.config.campoNome,
          this.config.campoTelefone,
          this.config.campoTipo
        ));
        assignedSet.add(pick[this.config.campoNome]);

        const contador = childCounts.get(interName) || 0;
        // logger.info(`🧒 Criança distribuída: ${pick[this.config.campoNome]} -> ${interName} (histórico: ${contador} crianças)`);
      }
    });

    // 2ª passada: distribuir crianças restantes
    const remainingChildren = shuffledChildren.filter(c => !assignedSet.has(c[this.config.campoNome]));
    if (!remainingChildren.length) return;

    intercessors.forEach(inter => {
      if (!this.rules.podeReceberMaisNomes(inter, this.config.maxPorIntercessor)) return;

      const eligibleChildren = this.getEligibleTargets(inter, remainingChildren, assignedSet, historySets, "crianca");
      if (eligibleChildren.length > 0) {
        const pick = eligibleChildren[0];
        inter.prayerList.push(this.rules.formatarParaDistribuicao(
          pick,
          this.config.campoNome,
          this.config.campoTelefone,
          this.config.campoTipo
        ));
        assignedSet.add(pick[this.config.campoNome]);
      }
    });

    logger.info('🧒 Crianças distribuídas!')
  }

  distributeAdultsRounds(intercessors, adultsPool, assignedSet, historySets, rounds = 2) {
    if (!adultsPool.length) return;
    const shuffledAdults = this.rules.embaralharArray(adultsPool);

    for (let r = 0; r < rounds; r++) {
      // Regra 6: Ordenar por histórico geral (quem orou por menos pessoas primeiro)
      const intercessorsByHistory = this.rules.ordenarPorHistoricoGeral(
        intercessors,
        historySets,
        this.config.campoNome
      );

      logger.info(`📋 Rodada ${r + 1} de adultos - Priorização por histórico aplicada`);

      intercessorsByHistory.forEach(inter => {
        if (!this.rules.podeReceberMaisNomes(inter, this.config.maxPorIntercessor)) return;

        const eligibleAdults = this.getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, "adulto");
        if (eligibleAdults.length > 0) {
          const pick = eligibleAdults[0];
          inter.prayerList.push(this.rules.formatarParaDistribuicao(
            pick,
            this.config.campoNome,
            this.config.campoTelefone,
            this.config.campoTipo
          ));
          assignedSet.add(pick[this.config.campoNome]);

          const interName = inter[this.config.campoNome];
          const historico = (historySets.get(interName) || new Set()).size;
          // logger.info(`👨 Adulto distribuído (R${r + 1}): ${pick[this.config.campoNome]} -> ${interName} (histórico: ${historico} pessoas)`);
        }
      });
    }
  }

  distributeThirdByHistory(intercessors, adultsPool, childrenPool, assignedSet, historySets) {
    // Ordenar por quem orou por menos pessoas no histórico
    const uniqueCounts = new Map(
      intercessors.map(inter => {
        const name = inter[this.config.campoNome];
        const count = (historySets.get(name) || new Set()).size;
        return [name, count];
      })
    );

    const sorted = [...intercessors].sort((a, b) => {
      const na = a[this.config.campoNome];
      const nb = b[this.config.campoNome];
      return (uniqueCounts.get(na) || 0) - (uniqueCounts.get(nb) || 0);
    });

    const shuffledAdults = this.rules.embaralharArray(adultsPool);
    const shuffledChildren = this.rules.embaralharArray(childrenPool);

    sorted.forEach(inter => {
      if (!this.rules.podeReceberMaisNomes(inter, this.config.maxPorIntercessor)) return;

      // Priorizar adultos
      let eligibles = this.getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, "adulto");

      // Se não houver adultos, tentar crianças
      if (!eligibles.length) {
        const remainingChildren = shuffledChildren.filter(c => !assignedSet.has(c[this.config.campoNome]));
        if (remainingChildren.length) {
          eligibles = this.getEligibleTargets(inter, remainingChildren, assignedSet, historySets, "crianca");
        }
      }

      if (eligibles.length > 0) {
        const pick = eligibles[0];
        inter.prayerList.push(this.rules.formatarParaDistribuicao(
          pick,
          this.config.campoNome,
          this.config.campoTelefone,
          this.config.campoTipo
        ));
        assignedSet.add(pick[this.config.campoNome]);
      }
    });
  }

  /**
   * 4ª Rodada: Distribuição flexível quando todos atingiram o limite
   */
  distributeFourthFlexible(intercessors, adultsPool, childrenPool, assignedSet, historySets, totalCandidates) {
    // Verificar se há pessoas não distribuídas
    const remainingCount = totalCandidates - assignedSet.size;
    if (remainingCount === 0) return;

    // Verificar se todos atingiram o limite máximo
    const canFlexibilize = this.rules.podeFlexibilizarLimite(intercessors, this.config.maxPorIntercessor);

    if (!canFlexibilize) {
      logger.info(`📊 Flexibilização não aplicada: nem todos atingiram o limite de ${this.config.maxPorIntercessor} nomes`);
      return;
    }

    logger.info(`🔧 Iniciando distribuição flexível: ${remainingCount} pessoas restantes`);
    logger.info(`📈 Limite flexibilizado de ${this.config.maxPorIntercessor} para ${this.config.limiteFlexivel} nomes`);

    // Ordenar por histórico geral (distribuição justa)
    const intercessorsByHistory = this.rules.ordenarPorHistoricoGeral(
      intercessors,
      historySets,
      this.config.campoNome
    );

    const shuffledAdults = this.rules.embaralharArray(adultsPool);
    const shuffledChildren = this.rules.embaralharArray(childrenPool);
    let distributed = 0;

    intercessorsByHistory.forEach(inter => {
      // Usar método flexível com limite configurável
      if (!this.rules.podeReceberMaisNomesFlexivel(inter, this.config.maxPorIntercessor, intercessors, this.config.limiteFlexivel)) return;

      // Tentar adultos primeiro
      let eligibles = this.getEligibleTargets(inter, shuffledAdults, assignedSet, historySets, "adulto");

      // Se não houver adultos, tentar crianças
      if (!eligibles.length) {
        const remainingChildren = shuffledChildren.filter(c => !assignedSet.has(c[this.config.campoNome]));
        eligibles = this.getEligibleTargets(inter, remainingChildren, assignedSet, historySets, "crianca");
      }

      if (eligibles.length > 0) {
        const pick = eligibles[0];
        inter.prayerList.push(this.rules.formatarParaDistribuicao(
          pick,
          this.config.campoNome,
          this.config.campoTelefone,
          this.config.campoTipo
        ));
        assignedSet.add(pick[this.config.campoNome]);
        distributed++;

        const interName = inter[this.config.campoNome];
        const currentCount = inter.prayerList.length;
        const historico = (historySets.get(interName) || new Set()).size;
        logger.info(`🔧 Flexível distribuído: ${pick[this.config.campoNome]} -> ${interName} (${currentCount} nomes, histórico: ${historico})`);
      }
    });

    if (distributed > 0) {
      logger.info(`✅ Distribuição flexível concluída: ${distributed} pessoas distribuídas na 4ª rodada`);
    } else {
      logger.info(`⚠️ Distribuição flexível não conseguiu distribuir nenhuma pessoa adicional`);
    }
  }

  getEligibleTargets(interObj, pool, assignedSet, historySets, preferType = null) {
    const interName = interObj[this.config.campoNome];
    const history = this.readHistory();
    const totalPessoas = this.data.length;

    let filtered = pool.filter(candidate => {
      const targetName = candidate[this.config.campoNome];
      if (!targetName) return false;

      // Aplicar todas as regras
      if (!this.rules.podeOrarPorPessoa(interName, targetName)) return false;
      if (this.rules.jaFoiAtribuidoNaSemana(targetName, assignedSet)) return false;
      if (this.rules.jaRecebeuPessoaNoHistorico(interName, targetName, history, totalPessoas, this.config.campoNome)) return false;

      return true;
    });

    // Aplicar preferência de tipo se especificada
    if (preferType) {
      const targetTypes = preferType === "crianca" ? ["crianca", "criança"] : ["adulto"];
      filtered = filtered.sort((a, b) => {
        const ta = (a[this.config.campoTipo] || "").toString().toLowerCase();
        const tb = (b[this.config.campoTipo] || "").toString().toLowerCase();
        const pa = targetTypes.includes(ta) ? 0 : 1;
        const pb = targetTypes.includes(tb) ? 0 : 1;
        return pa - pb;
      });
    }

    return filtered;
  }

  // ---------- Execução principal ----------

  generateDistribution() {
    const intercessorsRaw = this.getIntercessors();
    const candidatesRaw = this.getCandidates();

    if (!intercessorsRaw.length) throw new Error("Nenhum intercessor encontrado na lista");
    if (!candidatesRaw.length) throw new Error("Nenhuma pessoa para receber oração encontrada");

    const totalCandidates = candidatesRaw.length;

    // *** SISTEMA DE MÚLTIPLAS TENTATIVAS ***
    if (this.config.resetAntecipado.tentativasHabilitadas) {
      return this.generateDistributionWithRetries(intercessorsRaw, candidatesRaw, totalCandidates);
    }

    // Fallback para o método original (sem múltiplas tentativas)
    return this.generateDistributionSingle(intercessorsRaw, candidatesRaw, totalCandidates);
  }

  /**
   * Gera distribuição com sistema de múltiplas tentativas
   */
  generateDistributionWithRetries(intercessorsRaw, candidatesRaw, totalCandidates) {
    const maxTentativas = this.config.resetAntecipado.maxTentativas;
    let melhorResultado = null;
    let melhorDistribuicao = 0;

    logger.info(`🔄 Sistema de múltiplas tentativas habilitado (máximo: ${maxTentativas} tentativas)`);

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      logger.info(`🎯 Tentativa ${tentativa}/${maxTentativas} de distribuição`);

      // Tentar distribuição completa
      const resultado = this.generateDistributionSingle(intercessorsRaw, candidatesRaw, totalCandidates);
      const distribuidas = this.contarPessoasDistribuidas(resultado);
      const taxaDistribuicao = distribuidas / totalCandidates;
      const pessoasNaoDistribuidas = totalCandidates - distribuidas;

      logger.info(`📊 Tentativa ${tentativa}: ${distribuidas}/${totalCandidates} pessoas (${(taxaDistribuicao * 100).toFixed(1)}%)`);

      // Se conseguiu 100%, finalizar
      if (distribuidas === totalCandidates) {
        logger.info(`✅ Distribuição completa alcançada na tentativa ${tentativa}!`);
        this.salvarResultado(resultado);
        return resultado;
      }

      // Guardar o melhor resultado até agora
      if (distribuidas > melhorDistribuicao) {
        melhorDistribuicao = distribuidas;
        melhorResultado = resultado;
        logger.info(`📈 Novo melhor resultado: ${distribuidas}/${totalCandidates} pessoas`);
      }

      // Se não é a última tentativa, fazer reset antecipado
      if (tentativa < maxTentativas) {
        logger.info(`🔄 Preparando reset antecipado para próxima tentativa...`);
        this.executarResetParaProximaTentativa(intercessorsRaw, totalCandidates, pessoasNaoDistribuidas);
      }
    }

    // Usar o melhor resultado obtido
    logger.info(`🏁 Finalizando com melhor resultado: ${melhorDistribuicao}/${totalCandidates} pessoas (${(melhorDistribuicao/totalCandidates * 100).toFixed(1)}%)`);
    this.salvarResultado(melhorResultado);

    const naoDistribuidas = totalCandidates - melhorDistribuicao;
    if (naoDistribuidas > 0) {
      logger.warn(`⚠️ Atenção: ${naoDistribuidas} pessoas não foram distribuídas após ${maxTentativas} tentativas.`);
    }

    return melhorResultado;
  }

  /**
   * Gera distribuição única (método original)
   */
  generateDistributionSingle(intercessorsRaw, candidatesRaw, totalCandidates) {
    // Estrutura de saída
    const intercessors = intercessorsRaw.map(p => ({
      [this.config.campoNome]: p[this.config.campoNome],
      [this.config.campoTelefone]: p[this.config.campoTelefone],
      prayerList: []
    }));

    // Separar candidatos por tipo
    const { adultos, criancas } = this.rules.separarPorTipo(candidatesRaw, this.config.campoTipo);

    // Estado da semana
    const assigned = new Set();
    const history = this.readHistory();

    // *** VERIFICAR E RESETAR CICLOS ANTES DE CONSTRUIR OS CONJUNTOS ***
    const historySetsTemp = this.rules.construirConjuntosHistorico(history, this.config.campoNome);
    const resetCount = this.rules.verificarEResetarCiclos(intercessors, historySetsTemp, this.data, this.config);

    // Se houve resets, recarregar o histórico atualizado
    let historySets;
    if (resetCount > 0) {
      const updatedHistory = this.readHistory();
      historySets = this.rules.construirConjuntosHistorico(updatedHistory, this.config.campoNome);
      logger.info(`🔄 Histórico recarregado após ${resetCount} resets`);
    } else {
      historySets = historySetsTemp;
    }

    // Aplicar regras de distribuição
    this.distributeChildren(intercessors, criancas, assigned, historySets);
    this.distributeAdultsRounds(intercessors, adultos, assigned, historySets, 2);
    this.distributeThirdByHistory(intercessors, adultos, criancas, assigned, historySets);
    this.distributeFourthFlexible(intercessors, adultos, criancas, assigned, historySets, candidatesRaw.length);

    return intercessors;
  }

  /**
   * Conta quantas pessoas foram distribuídas
   */
  contarPessoasDistribuidas(intercessors) {
    const distribuidas = new Set();
    intercessors.forEach(inter => {
      inter.prayerList.forEach(person => {
        distribuidas.add(person[this.config.campoNome]);
      });
    });
    return distribuidas.size;
  }

  /**
   * Executa reset antecipado para preparar próxima tentativa
   */
  executarResetParaProximaTentativa(intercessorsRaw, totalAlvos, pessoasNaoDistribuidas) {
    const history = this.readHistory();
    const historySets = this.rules.construirConjuntosHistorico(history, this.config.campoNome);

    // Encontrar candidatos para reset
    const proximosDoFim = this.rules.encontrarIntercessoresMaisProximosDoFim(
      intercessorsRaw,
      historySets,
      totalAlvos,
      this.config
    );

    if (proximosDoFim.length === 0) {
      logger.info(`⚠️ Nenhum intercessor próximo do fim encontrado para reset`);
      return;
    }

    // Determinar quantos resetar usando o número real de pessoas não distribuídas
    const quantidadeParaReset = this.rules.determinarQuantidadeParaReset(
      proximosDoFim,
      this.config,
      pessoasNaoDistribuidas
    );

    if (quantidadeParaReset > 0) {
      const intercessoresParaReset = proximosDoFim.slice(0, quantidadeParaReset);

      logger.info(`🔧 Executando reset antecipado de ${quantidadeParaReset} intercessores para próxima tentativa`);
      logger.info(`📊 Reset baseado em: ${pessoasNaoDistribuidas} pessoas não distribuídas (tipo: ${this.config.resetAntecipado.tipo})`);

      const resetAntecipados = this.rules.executarResetAntecipado(
        intercessoresParaReset,
        historySets,
        this.config,
        `preparação para nova tentativa`
      );

      logger.info(`✅ ${resetAntecipados} resets executados com sucesso`);
    }
  }

  /**
   * Salva o resultado final
   */
  salvarResultado(intercessors) {
    this.historyManager.save(this.config.contextKey, intercessors, [this.config.campoNome]);

    const distribuidas = this.contarPessoasDistribuidas(intercessors);
    logger.info(`✅ Distribuição concluída: ${distribuidas} pessoas distribuídas`);
  }
}

module.exports = PrayRulesImplementation;
