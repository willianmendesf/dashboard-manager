export interface PrayerConfig {
  maxPorIntercessor: number;
  maxCriancasPorIntercessor: number;
  limiteFlexivel: number;
  resetAntecipado: ResetAntecipadoConfig;
  modoDesenvolvimento: boolean;
}

export interface ResetAntecipadoConfig {
  habilitado: boolean;
  tipo: 'fixo' | 'dinamico' | 'proporcional';
  quantidade: number;
  limiteProximidade: number;
  limiteDistribuicao: number;
  maxTentativas: number;
  tentativasHabilitadas: boolean;
}

