const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Classe que contém apenas as regras de negócio para distribuição de orações
 * Regras implementadas:
 * - Regra 1: limite de 1 criança por intercessor (se possível)
 * - Regra 2: não orar por si mesmo
 * - Regra 3: unicidade semanal e por intercessor
 * - Regra 4: não repetir nomes até completar ciclo
 * - Regra 5: máximo de 3 nomes por intercessor
 * - Regra 6: distribuição justa (rodadas + histórico)
 * - Regra 7: reinício de ciclo com reset de histórico
 * - Regra 8: priorização de crianças por quem nunca recebeu
 */
class PrayerRules {
  constructor(historyManager, endCycleFilePath) {
    this.historyManager = historyManager;
    this.endCycleFilePath = endCycleFilePath;
  }

  /**
   * Regra 7: Salva registro de ciclo completado
   */
  salvarCicloCompletado(intercessorData, campoNome) {
    let endCycleHistory = {};

    if (fs.existsSync(this.endCycleFilePath)) {
      try {
        const raw = fs.readFileSync(this.endCycleFilePath, 'utf8');
        endCycleHistory = JSON.parse(raw);
      } catch (err) {
        logger.warn('Arquivo prayersEndCicle.json estava corrompido, será recriado');
      }
    }

    const todayDate = new Date().toISOString().split('T')[0];
    if (!endCycleHistory[todayDate]) {
      endCycleHistory[todayDate] = [];
    }

    endCycleHistory[todayDate].push({
      [campoNome]: intercessorData[campoNome]
    });

    fs.writeFileSync(this.endCycleFilePath, JSON.stringify(endCycleHistory, null, 2), 'utf8');
    logger.info(`✅ Ciclo completado registrado para: ${intercessorData[campoNome]}`);
  }

  /**
   * Regra 7: Limpa o histórico completo de um intercessor (reset de ciclo)
   */
  limparHistoricoIntercessor(nomeIntercessor, contextKey, campoNome) {
    return this.historyManager.clearHistoryFor(
      contextKey,
      { [campoNome]: nomeIntercessor },
      [campoNome]
    );
  }

  /**
   * Reset antecipado: Encontra intercessores mais próximos de completar o ciclo
   */
  encontrarIntercessoresMaisProximosDoFim(intercessores, conjuntosHistorico, totalAlvos, config) {
    const proximosDoFim = [];

    intercessores.forEach(inter => {
      const nomeInter = inter[config.campoNome];
      const contagemUnica = (conjuntosHistorico.get(nomeInter) || new Set()).size;
      const totalAlvosExcluindoSiMesmo = totalAlvos - 1;
      const restantes = totalAlvosExcluindoSiMesmo - contagemUnica;

      if (restantes > 0) { // Não incluir quem já completou
        proximosDoFim.push({
          intercessor: inter,
          nome: nomeInter,
          contagemUnica,
          restantes,
          percentualCompleto: (contagemUnica / totalAlvosExcluindoSiMesmo) * 100
        });
      }
    });

    // Ordenar por menor quantidade restante (mais próximos do fim)
    proximosDoFim.sort((a, b) => a.restantes - b.restantes);

    return proximosDoFim;
  }

  /**
   * Reset antecipado: Executa reset dos intercessores selecionados
   */
  executarResetAntecipado(intercessoresParaReset, conjuntosHistorico, config, motivo = 'distribuição baixa') {
    let resetCount = 0;

    intercessoresParaReset.forEach(item => {
      const inter = item.intercessor;
      const nomeInter = item.nome;

      logger.info(`🔄 Reset antecipado para: ${nomeInter} (${item.contagemUnica}/${item.contagemUnica + item.restantes} pessoas, ${item.percentualCompleto.toFixed(1)}% completo) - Motivo: ${motivo}`);

      // Registrar reset antecipado (diferente do ciclo completo)
      this.salvarResetAntecipado(inter, config.campoNome, motivo, item.percentualCompleto);

      // Limpar histórico do intercessor
      const limpoComSucesso = this.limparHistoricoIntercessor(nomeInter, config.contextKey, config.campoNome);

      if (limpoComSucesso) {
        // Remover do mapa de histórico atual para esta execução
        conjuntosHistorico.set(nomeInter, new Set());
        resetCount++;
        logger.info(`✅ Reset antecipado completo para: ${nomeInter}`);
      } else {
        logger.warn(`⚠️ Falha ao limpar histórico para: ${nomeInter}`);
      }
    });

    if (resetCount > 0) {
      logger.info(`🔄 Total de resets antecipados executados: ${resetCount}`);
    }

    return resetCount;
  }

  /**
   * Reset antecipado: Salva registro de reset antecipado (diferente de ciclo completo)
   */
  salvarResetAntecipado(intercessorData, campoNome, motivo, percentualCompleto) {
    let endCycleHistory = {};

    if (fs.existsSync(this.endCycleFilePath)) {
      try {
        const raw = fs.readFileSync(this.endCycleFilePath, 'utf8');
        endCycleHistory = JSON.parse(raw);
      } catch (err) {
        logger.warn('Arquivo prayersEndCicle.json estava corrompido, será recriado');
      }
    }

    const todayDate = new Date().toISOString().split('T')[0];
    if (!endCycleHistory[todayDate]) {
      endCycleHistory[todayDate] = [];
    }

    endCycleHistory[todayDate].push({
      [campoNome]: intercessorData[campoNome],
      tipoReset: 'antecipado',
      motivo: motivo,
      percentualCompleto: parseFloat(percentualCompleto.toFixed(1)),
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(this.endCycleFilePath, JSON.stringify(endCycleHistory, null, 2), 'utf8');
    logger.info(`📝 Reset antecipado registrado para: ${intercessorData[campoNome]} (${percentualCompleto.toFixed(1)}% completo)`);
  }

  /**
   * Reset antecipado: Determina quantos intercessores resetar baseado na configuração
   */
  determinarQuantidadeParaReset(proximosDoFim, config, pessoasNaoDistribuidas) {
    if (!config.resetAntecipado || !config.resetAntecipado.habilitado) {
      return 0;
    }

    const { tipo, quantidade, limiteProximidade } = config.resetAntecipado;

    // Filtrar apenas intercessores próximos o suficiente do fim
    const candidatos = proximosDoFim.filter(item => {
      return item.restantes <= limiteProximidade;
    });

    if (candidatos.length === 0) {
      logger.info(`⚠️ Nenhum intercessor próximo o suficiente do fim (limite: ${limiteProximidade} pessoas restantes)`);
      return 0;
    }

    let quantidadeParaReset = 0;

    switch (tipo) {
      case 'fixo':
        quantidadeParaReset = Math.min(quantidade, candidatos.length);
        break;

      case 'dinamico':
        // Dinâmico: resetar baseado na quantidade de pessoas não distribuídas
        quantidadeParaReset = Math.min(
          Math.ceil(pessoasNaoDistribuidas / 2), // Proporção baseada nas não distribuídas
          candidatos.length
        );
        break;

      case 'proporcional':
        // Proporcional: percentual dos candidatos próximos, quantidade deve estar entre 0 e 1 (ex: 0.4 = 40%)
        const percentual = quantidade;
        quantidadeParaReset = Math.max(1, Math.floor(candidatos.length * percentual));
        break;

      default:
        logger.warn(`⚠️ Tipo de reset antecipado inválido: ${tipo}. Usando valor fixo.`);
        quantidadeParaReset = Math.min(quantidade || 3, candidatos.length);
    }

    logger.info(`📊 Reset antecipado - Candidatos próximos: ${candidatos.length}, Para resetar: ${quantidadeParaReset}`);

    return quantidadeParaReset;
  }

  /**
   * Regra 8: Constrói contadores de crianças recebidas por intercessor
   */
  construirContadorCriancas(historico, campoNome, campoTipo) {
    const contadorCriancas = new Map();

    Object.values(historico).forEach(listaData => {
      (listaData || []).forEach(entrada => {
        const nomeInter = entrada?.[campoNome];
        const lista = Array.isArray(entrada?.prayerList) ? entrada.prayerList : [];
        if (!nomeInter) return;

        if (!contadorCriancas.has(nomeInter)) contadorCriancas.set(nomeInter, 0);

        lista.forEach(pessoa => {
          const tipo = (pessoa?.[campoTipo] || "").toString().toLowerCase();
          if (tipo === "crianca" || tipo === "criança") {
            contadorCriancas.set(nomeInter, contadorCriancas.get(nomeInter) + 1);
          }
        });
      });
    });

    return contadorCriancas;
  }

  /**
   * Regra 7: Verifica se precisa fazer reset de ciclo e executa se necessário
   */
  verificarEResetarCiclos(intercessores, conjuntosHistorico, pessoasData, config) {
    const totalAlvos = pessoasData.filter(p => p[config.campoNome]).length;
    let resetCount = 0;

    intercessores.forEach(inter => {
      const nomeInter = inter[config.campoNome];
      const contagemUnica = (conjuntosHistorico.get(nomeInter) || new Set()).size;
      const totalAlvosExcluindoSiMesmo = totalAlvos - 1; // Regra 2: não pode orar por si mesmo

      // logger.info(`🔍 Verificando ciclo de ${nomeInter}: ${contagemUnica}/${totalAlvosExcluindoSiMesmo} pessoas`);

      // Regra 7: Se completou o ciclo, fazer reset
      if (contagemUnica >= totalAlvosExcluindoSiMesmo) {
        logger.info(`🔄 Resetando ciclo para: ${nomeInter} (orou por ${contagemUnica}/${totalAlvosExcluindoSiMesmo} pessoas)`);

        // Registrar ciclo completado
        this.salvarCicloCompletado(inter, config.campoNome);

        // Limpar histórico do intercessor
        const limpoComSucesso = this.limparHistoricoIntercessor(nomeInter, config.contextKey, config.campoNome);

        if (limpoComSucesso) {
          // Remover do mapa de histórico atual para esta execução
          conjuntosHistorico.set(nomeInter, new Set());
          resetCount++;
          logger.info(`✅ Reset completo para: ${nomeInter}`);
        } else {
          logger.warn(`⚠️ Falha ao limpar histórico para: ${nomeInter}`);
        }
      }
    });

    if (resetCount > 0) {
      logger.info(`🔄 Total de ciclos resetados: ${resetCount}`);
    }

    return resetCount;
  }

  /**
   * Regra 2: Não orar por si mesmo
   */
  podeOrarPorPessoa(nomeIntercessor, nomePessoa) {
    return nomeIntercessor !== nomePessoa;
  }

  /**
   * Regra 3: Unicidade semanal
   */
  jaFoiAtribuidoNaSemana(nomePessoa, atribuidosNaSemana) {
    return atribuidosNaSemana.has(nomePessoa);
  }

  /**
   * Regra 4: Não repetir até completar ciclo
   */
  jaRecebeuPessoaNoHistorico(nomeIntercessor, nomePessoa, historico, totalPessoas, campoNome) {
    const pessoasRecebidas = new Set();

    Object.keys(historico).forEach(data => {
      const distribuicaoData = historico[data];
      const intercessorData = distribuicaoData.find(d => d[campoNome] === nomeIntercessor);

      if (intercessorData && intercessorData.prayerList) {
        intercessorData.prayerList.forEach(pessoa => {
          pessoasRecebidas.add(pessoa[campoNome]);
        });
      }
    });

    // Regra 7: Se já recebeu todos, pode receber qualquer um novamente
    if (pessoasRecebidas.size >= totalPessoas - 1) {
      return false;
    }

    // Regra 4: Se não completou o ciclo, verificar se já recebeu esta pessoa específica
    return pessoasRecebidas.has(nomePessoa);
  }

  /**
   * Regra 5: Máximo de nomes por intercessor
   */
  podeReceberMaisNomes(distribuicaoIntercessor, maxPorIntercessor) {
    return distribuicaoIntercessor.prayerList.length < maxPorIntercessor;
  }

  /**
   * Regra 5 - Flexibilizada: Verifica se pode flexibilizar o limite quando todos atingiram o máximo
   */
  podeFlexibilizarLimite(distribuicaoCompleta, maxPorIntercessor) {
    // Verificar se TODOS os intercessores já têm o máximo de nomes
    const todosComMaximo = distribuicaoCompleta.every(inter =>
      inter.prayerList.length >= maxPorIntercessor
    );

    return todosComMaximo;
  }

  /**
   * Regra 5 - Flexibilizada: Máximo de nomes considerando flexibilização
   */
  podeReceberMaisNomesFlexivel(distribuicaoIntercessor, maxPorIntercessor, distribuicaoCompleta, limiteFlexivel = 5) {
    const limiteAtual = this.podeFlexibilizarLimite(distribuicaoCompleta, maxPorIntercessor)
      ? limiteFlexivel
      : maxPorIntercessor;

    return distribuicaoIntercessor.prayerList.length < limiteAtual;
  }

  /**
   * Regra 1: Máximo de 1 criança por intercessor (se possível)
   */
  jaTemCrianca(distribuicaoIntercessor, campoTipo) {
    return distribuicaoIntercessor.prayerList.some(p => {
      const tipo = (p?.[campoTipo] || "").toString().toLowerCase();
      return tipo === "crianca" || tipo === "criança";
    });
  }

  /**
   * Regra 8: Ordenar intercessores por quantidade de crianças recebidas (priorização)
   */
  ordenarPorContadorCriancas(distribuicao, contadorCriancas, campoNome) {
    return [...distribuicao].sort((a, b) => {
      const contadorA = contadorCriancas.get(a[campoNome]) || 0;
      const contadorB = contadorCriancas.get(b[campoNome]) || 0;
      return contadorA - contadorB;
    });
  }

  /**
   * Utilitário: Embaralhar array (algoritmo Fisher-Yates)
   */
  embaralharArray(array) {
    const arrayEmbaralhado = [...array];
    for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
    }
    return arrayEmbaralhado;
  }

  /**
   * Utilitário: Separar pessoas por tipo
   */
  separarPorTipo(pessoas, campoTipo) {
    const criancas = pessoas.filter(p =>
      p[campoTipo]?.toLowerCase() === 'crianca' ||
      p[campoTipo]?.toLowerCase() === 'criança'
    );
    const adultos = pessoas.filter(p =>
      p[campoTipo]?.toLowerCase() !== 'crianca' &&
      p[campoTipo]?.toLowerCase() !== 'criança'
    );

    return { criancas, adultos };
  }

  /**
   * Utilitário: Construir conjuntos de histórico
   */
  construirConjuntosHistorico(historico, campoNome) {
    const map = new Map();

    Object.values(historico).forEach(listaData => {
      (listaData || []).forEach(entrada => {
        const nomeInter = entrada?.[campoNome];
        const lista = Array.isArray(entrada?.prayerList) ? entrada.prayerList : [];
        if (!nomeInter) return;

        if (!map.has(nomeInter)) map.set(nomeInter, new Set());
        const conjunto = map.get(nomeInter);

        lista.forEach(pessoa => {
          const nomeAlvo = pessoa?.[campoNome];
          if (nomeAlvo) conjunto.add(nomeAlvo);
        });
      });
    });

    return map;
  }

  /**
   * Formatar pessoa para distribuição
   */
  formatarParaDistribuicao(pessoa, campoNome, campoTelefone, campoTipo) {
    const resultado = {
      [campoNome]: pessoa[campoNome],
      [campoTipo]: pessoa[campoTipo]
    };

    if (pessoa[campoTelefone]) {
      resultado[campoTelefone] = pessoa[campoTelefone];
    }

    if (pessoa.responsavel || pessoa.reponsavel) {
      resultado.responsavel = pessoa.responsavel || pessoa.reponsavel;
    }

    return resultado;
  }

  /**
   * Utilitário: Ordenar intercessores por histórico geral (quem orou por menos pessoas)
   */
  ordenarPorHistoricoGeral(distribuicao, historySets, campoNome) {
    return [...distribuicao].sort((a, b) => {
      const contadorA = (historySets.get(a[campoNome]) || new Set()).size;
      const contadorB = (historySets.get(b[campoNome]) || new Set()).size;
      return contadorA - contadorB; // Quem orou por menos pessoas vem primeiro
    });
  }
}

module.exports = PrayerRules;
