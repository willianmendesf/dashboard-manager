// Exemplo de uso do Oracao360Service
const Oracao360Service = require('../service/Oracao360Service');

// Dados de exemplo
const pessoasData = [
  {
    nome: 'João Silva',
    numero: '11999999001',
    intercessor: true,
    type: 'adulto',
    dataInicioIntercessao: '2022-01-15' // Intercessor antigo (>6 meses)
  },
  {
    nome: 'Maria Santos',
    numero: '11999999002',
    intercessor: true,
    type: 'adulto',
    dataInicioIntercessao: '2024-06-10' // Intercessor novo (<6 meses)
  },
  {
    nome: 'Pedro Costa',
    numero: '11999999003',
    intercessor: true,
    type: 'adulto',
    dataInicioIntercessao: '2024-07-20' // Intercessor novo
  },
  {
    nome: 'Ana Oliveira',
    numero: '11999999004',
    intercessor: false,
    type: 'adulto'
  },
  {
    nome: 'Carlos Mendes',
    numero: '11999999005',
    intercessor: false,
    type: 'adulto'
  },
  {
    nome: 'Juliana Lima',
    numero: '11999999006',
    intercessor: false,
    type: 'adulto'
  },
  {
    nome: 'Roberto Ferreira',
    numero: '11999999007',
    intercessor: false,
    type: 'adulto'
  },
  {
    nome: 'Luiza Pequena',
    numeroResponsavel: '11999999008',
    intercessor: false,
    type: 'crianca'
  },
  {
    nome: 'Gabriel Pequeno',
    numeroResponsavel: '11999999009',
    intercessor: false,
    type: 'crianca'
  },
  {
    nome: 'Sofia Pequena',
    numeroResponsavel: '11999999010',
    intercessor: false,
    type: 'crianca'
  }
];

// Configuração personalizada (opcional)
const config = {
  campoIntercessor: 'intercessor',
  campoNome: 'nome',
  campoTelefone: 'numero',
  campoTipo: 'type',
  campoDataInicioIntercessao: 'dataInicioIntercessao',
  mesesParaSerConsideradoAntigo: 6,
  maxCriancasPorPessoa: 1
};

// Criar instância do serviço
const oracao360 = new Oracao360Service(pessoasData, config);

// Exemplo de uso
try {
  console.log('=== SERVIÇO ORAÇÃO 360 ===\n');

  // Obter estatísticas
  console.log('📊 Estatísticas:');
  const stats = oracao360.obterEstatisticas();
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n');

  // Gerar distribuição semanal
  console.log('🙏 Gerando distribuição semanal...\n');
  const distribuicao = oracao360.gerarDistribuicaoSemanal();

  console.log('✅ Distribuição gerada com sucesso!\n');

  // Exibir resultado
  console.log('📋 RESULTADO DA DISTRIBUIÇÃO:');
  console.log('=====================================\n');

  distribuicao.forEach((intercessor, index) => {
    console.log(`${index + 1}. ${intercessor.nome} (${intercessor.numero})`);
    console.log('   Lista de Oração:');

    if (intercessor.prayerList.length === 0) {
      console.log('   → Nenhuma pessoa atribuída');
    } else {
      intercessor.prayerList.forEach((pessoa, idx) => {
        const tipo = pessoa.type === 'crianca' ? '👶' : '👤';
        console.log(`   ${idx + 1}. ${tipo} ${pessoa.nome} (${pessoa.numero}) - ${pessoa.type}`);
      });
    }
    console.log('');
  });

  // Mostrar estatísticas finais
  console.log('📈 ESTATÍSTICAS DA DISTRIBUIÇÃO:');
  console.log('=====================================');

  const totalPessoas = pessoasData.filter(p => !p.intercessor).length;
  const pessoasDistribuidas = distribuicao.reduce((total, dist) => total + dist.prayerList.length, 0);
  const criancasDistribuidas = distribuicao.reduce((total, dist) => {
    return total + dist.prayerList.filter(p => p.type === 'crianca').length;
  }, 0);

  console.log(`Total de pessoas para oração: ${totalPessoas}`);
  console.log(`Pessoas distribuídas: ${pessoasDistribuidas}`);
  console.log(`Crianças distribuídas: ${criancasDistribuidas}`);
  console.log(`Eficiência: ${((pessoasDistribuidas/totalPessoas)*100).toFixed(1)}%`);

} catch (error) {
  console.error('❌ Erro:', error.message);
}

// Para testar múltiplas semanas (descomente para testar)
/*
console.log('\n\n=== TESTANDO MÚLTIPLAS SEMANAS ===\n');

for (let semana = 1; semana <= 3; semana++) {
  console.log(`\n--- SEMANA ${semana} ---`);
  try {
    const dist = oracao360.gerarDistribuicaoSemanal();
    console.log(`✅ Semana ${semana}: ${dist.length} intercessores distribuídos`);
  } catch (error) {
    console.log(`❌ Semana ${semana}: ${error.message}`);
  }
}
*/
