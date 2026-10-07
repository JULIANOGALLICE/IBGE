import {
  CartorioConfig,
  ConjugeData,
  EscrituraAlert,
  EscrituraRecord,
  RawCsvRow,
  Tabinf07Row,
  Tabinf12Summary,
  ValidationItem,
} from '../types/ibge';

export const UF_MAP: Record<string, string> = {
  RO: '11',
  AC: '12',
  AM: '13',
  RR: '14',
  PA: '15',
  AP: '16',
  TO: '17',
  MA: '21',
  PI: '22',
  CE: '23',
  RN: '24',
  PB: '25',
  PE: '26',
  AL: '27',
  SE: '28',
  BA: '29',
  MG: '31',
  ES: '32',
  RJ: '33',
  SP: '35',
  PR: '41',
  SC: '42',
  RS: '43',
  MS: '50',
  MT: '51',
  GO: '52',
  DF: '53',
  ESTRANGEIRO: '98',
  IGNORADO: '99',
};

export const UF_NAME_MAP: Record<string, string> = {
  '11': 'RO',
  '12': 'AC',
  '13': 'AM',
  '14': 'RR',
  '15': 'PA',
  '16': 'AP',
  '17': 'TO',
  '21': 'MA',
  '22': 'PI',
  '23': 'CE',
  '24': 'RN',
  '25': 'PB',
  '26': 'PE',
  '27': 'AL',
  '28': 'SE',
  '29': 'BA',
  '31': 'MG',
  '32': 'ES',
  '33': 'RJ',
  '35': 'SP',
  '41': 'PR',
  '42': 'SC',
  '43': 'RS',
  '50': 'MS',
  '51': 'MT',
  '52': 'GO',
  '53': 'DF',
  '98': 'EX',
  '99': 'IGN',
};

export const DEFAULT_CONFIG: CartorioConfig = {
  ufPesquisa: '41', // Paraná (PR)
  munPesquisa: '06902', // Curitiba
  distPesquisa: '05', // Distrito (05 = Uberaba)
  codCartorio: '19', // Cartório (19 = SERVIÇO DISTRITAL DO UBERABA)
  nomeCartorio: 'SERVIÇO DISTRITAL DO UBERABA',
  anoPesquisa: '2026', // Ano
  trimPesquisa: '3', // 3º Trimestre (Jul/Ago/Set)
  emptyChildrenAs99: true, // Conforme Regra 9 do PDF (99 para numéricos sem valor)
};

/**
 * Converte data de formatos como DD/MM/AAAA ou AAAA-MM-DD para DDMMAAAA (8 dígitos).
 * Se vazio, retorna '99999999' conforme item 9 do layout.
 */
export function formatDataToDDMMAAAA(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return '99999999';
  }
  const clean = dateStr.trim();
  // Se já tem 8 dígitos numéricos
  if (/^\d{8}$/.test(clean)) {
    return clean;
  }
  // Formato DD/MM/AAAA
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
  }
  // Formato AAAA-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
  }
  return '99999999';
}

/**
 * Converte DDMMAAAA para exibição amigável DD/MM/AAAA.
 */
export function formatDDMMAAAAToDisplay(val?: string): string {
  if (!val || val === '99999999' || val.length !== 8) {
    return 'Não informado';
  }
  return `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4, 8)}`;
}

/**
 * Converte string DDMMAAAA para objeto Date em UTC para cálculo de intervalos
 */
export function parseDDMMAAAAToDate(val?: string): Date | null {
  if (!val || val === '99999999' || val.length !== 8) return null;
  const d = parseInt(val.substring(0, 2), 10);
  const m = parseInt(val.substring(2, 4), 10) - 1;
  const y = parseInt(val.substring(4, 8), 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  const date = new Date(Date.UTC(y, m, d));
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Converte UF (sigla ou código) para código numérico de 2 dígitos.
 */
export function parseUfCode(ufStr?: string): string {
  if (!ufStr || !ufStr.trim()) return '99';
  const clean = ufStr.trim().toUpperCase();
  if (/^\d{2}$/.test(clean)) return clean;
  if (UF_MAP[clean]) return UF_MAP[clean];
  return '99';
}

/**
 * Extrai o código de 5 dígitos do município conforme Tabela do IBGE (coluna G).
 * No CSV vem frequentemente no formato "35-5030.8" ou "41-0690.2".
 */
export function parseMunCode(codMunRaw?: string, ufCode?: string): string {
  if (!codMunRaw || !codMunRaw.trim()) {
    return '99999';
  }
  const clean = codMunRaw.trim();
  // Se já tem exatamente 5 dígitos
  if (/^\d{5}$/.test(clean)) {
    return clean;
  }
  // Caso comum do cartório: "XX-YYYY.Z" => YYYY + Z (5 dígitos)
  const patternMatch = clean.match(/^\d{2}-(\d{4})\.(\d)$/);
  if (patternMatch) {
    return `${patternMatch[1]}${patternMatch[2]}`;
  }
  // Caso de remover pontuação
  const allDigits = clean.replace(/\D/g, '');
  if (allDigits.length === 5) {
    return allDigits;
  }
  if (allDigits.length === 7) {
    // Se tem 7 dígitos (código completo IBGE: UF + 5 dígitos)
    return allDigits.substring(2, 7);
  }
  if (allDigits.length >= 5) {
    return allDigits.substring(allDigits.length - 5);
  }
  return allDigits.padStart(5, '0');
}

/**
 * Regra 10 do PDF para País:
 * OBS: Não utilizar o código 076 da Tabela de Países da ONU. Deverá ser utilizado o código 999.
 * Se UF <> (98, 59, 99) => Município = Código IBGE ou 99999 e PAÍS = 999.
 * Se UF = 98 (Estrangeiro) => PAÍS = Código ONU ou 999.
 * Se UF = 59 (Brasil) ou 99 (Ignorado) => PAÍS = 999.
 */
export function parsePaisCode(ufCode: string, paisRaw?: string): string {
  if (ufCode === '98') {
    // Estrangeiro
    if (paisRaw) {
      const clean = paisRaw.replace(/\D/g, '');
      if (clean && clean !== '55' && clean !== '076') {
        return clean.padStart(3, '0').substring(0, 3);
      }
    }
    return '999';
  }
  // Para qualquer estado brasileiro ou ignorado, o IBGE exige obrigatoriamente 999
  return '999';
}

/**
 * Converte o texto do regime de bens para código IBGE:
 * 1 = comunhão universal
 * 2 = comunhão parcial
 * 3 = separação
 * 9 = sem declaração
 */
export function parseRegimeBens(regimeStr?: string): { code: string; label: string } {
  if (!regimeStr || !regimeStr.trim()) {
    return { code: '9', label: 'Sem declaração' };
  }
  const norm = regimeStr.trim().toUpperCase();
  if (norm.includes('PARCIAL')) {
    return { code: '2', label: 'Comunhão Parcial' };
  }
  if (norm.includes('UNIVERSAL')) {
    return { code: '1', label: 'Comunhão Universal' };
  }
  if (norm.includes('SEPARAÇÃO') || norm.includes('SEPARACAO')) {
    return { code: '3', label: 'Separação de Bens' };
  }
  if (norm === '1') return { code: '1', label: 'Comunhão Universal' };
  if (norm === '2') return { code: '2', label: 'Comunhão Parcial' };
  if (norm === '3') return { code: '3', label: 'Separação de Bens' };
  return { code: '9', label: 'Sem declaração / Ignorado' };
}

/**
 * Converte sexo para código:
 * 1 = masculino
 * 2 = feminino
 */
export function parseSexo(sexoRaw?: string): string {
  if (!sexoRaw || !sexoRaw.trim()) return '1';
  const clean = sexoRaw.trim().toUpperCase();
  if (clean === 'M' || clean === 'MASCULINO' || clean === '1') return '1';
  if (clean === 'F' || clean === 'FEMININO' || clean === '2') return '2';
  return '1';
}

/**
 * Calcula todos os alertas e auditorias de inconsistências para uma única escritura
 * conforme solicitado:
 * 1. Mesmo sexo
 * 2. Sem regime de bens
 * 3. Sem data de casamento
 * 4. Sem data de nascimento
 * 5. Sem cidade de nascimento
 * 6. Sem cidade de residência
 * 7. Casamento recente (< 3 meses da data do divórcio)
 * 8. Casamento com mais de 18 anos sem filhos
 * 9. Diferença de idade do casal superior a 10 anos
 * 10. Menor de 18 anos na data do casamento
 */
export function computeEscrituraAlerts(
  escritura: Omit<EscrituraRecord, 'alerts'>
): EscrituraAlert[] {
  const alerts: EscrituraAlert[] = [];
  const { conjuge1, conjuge2, regimeBens, dataCasamento, dataAtoNotarial, dataAbertura, numFilhoMaior, numFilhoMenor } =
    escritura;

  // 1. Alerta: Sexo do casal é o mesmo (verificar se houve erro de digitação no cartório)
  if (conjuge1.sexo && conjuge2.sexo && conjuge1.sexo === conjuge2.sexo) {
    alerts.push({
      type: 'mesmo_sexo',
      severity: 'alerta',
      label: `Casal com mesmo sexo cadastrado (${conjuge1.sexo === '1' ? 'Masculino & Masculino' : 'Feminino & Feminino'}). Verifique se não houve erro de digitação no cartório.`,
      field: 'sexo',
    });
  }

  // 2. Faltando Regime de bens
  if (regimeBens === '9' || !regimeBens) {
    alerts.push({
      type: 'sem_regime',
      severity: 'aviso',
      label: 'Regime de bens não informado ou sem declaração (Código 9 gravado conforme layout).',
      field: 'regimeBens',
    });
  }

  // 3. Faltando Data de casamento
  if (dataCasamento === '99999999' || !dataCasamento) {
    alerts.push({
      type: 'sem_data_casamento',
      severity: 'aviso',
      label: 'Data do casamento ausente ou não informada (99999999 gravado conforme Regra 9).',
      field: 'dataCasamento',
    });
  }

  // 4. Faltando Data de nascimento
  if (conjuge1.dataNascimento === '99999999' || conjuge2.dataNascimento === '99999999') {
    const missingParts: string[] = [];
    if (conjuge1.dataNascimento === '99999999') missingParts.push('Cônjuge 1');
    if (conjuge2.dataNascimento === '99999999') missingParts.push('Cônjuge 2');
    alerts.push({
      type: 'sem_data_nascimento',
      severity: 'aviso',
      label: `Data de nascimento não informada para ${missingParts.join(' e ')} (99999999 gravado).`,
      field: 'dataNascimento',
    });
  }

  // 5. Faltando Cidade de nascimento
  if (
    !conjuge1.cidadeNasc ||
    conjuge1.codMunNasc === '99999' ||
    !conjuge2.cidadeNasc ||
    conjuge2.codMunNasc === '99999'
  ) {
    const missingParts: string[] = [];
    if (!conjuge1.cidadeNasc || conjuge1.codMunNasc === '99999') missingParts.push('Cônjuge 1');
    if (!conjuge2.cidadeNasc || conjuge2.codMunNasc === '99999') missingParts.push('Cônjuge 2');
    alerts.push({
      type: 'sem_cidade_nascimento',
      severity: 'aviso',
      label: `Cidade/Município de nascimento ausente ou ignorado para ${missingParts.join(' e ')} (99999 gravado).`,
      field: 'codMunNasc',
    });
  }

  // 6. Faltando Cidade de residência
  if (
    !conjuge1.cidadeRes ||
    conjuge1.codMunRes === '99999' ||
    !conjuge2.cidadeRes ||
    conjuge2.codMunRes === '99999'
  ) {
    const missingParts: string[] = [];
    if (!conjuge1.cidadeRes || conjuge1.codMunRes === '99999') missingParts.push('Cônjuge 1');
    if (!conjuge2.cidadeRes || conjuge2.codMunRes === '99999') missingParts.push('Cônjuge 2');
    alerts.push({
      type: 'sem_cidade_residencia',
      severity: 'aviso',
      label: `Cidade/Município de residência ausente ou ignorado para ${missingParts.join(' e ')} (99999 gravado).`,
      field: 'codMunRes',
    });
  }

  // Comparações Temporais
  const dDivorcio = parseDDMMAAAAToDate(dataAtoNotarial || dataAbertura);
  const dCasam = parseDDMMAAAAToDate(dataCasamento);
  const dNasc1 = parseDDMMAAAAToDate(conjuge1.dataNascimento);
  const dNasc2 = parseDDMMAAAAToDate(conjuge2.dataNascimento);

  // 7. Alerta: Data de casamento mais recente do que 3 meses da data do divórcio
  if (dDivorcio && dCasam) {
    const diffMs = dDivorcio.getTime() - dCasam.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      alerts.push({
        type: 'casamento_recente',
        severity: 'alerta',
        label: `Inconsistência cronológica: data do casamento (${formatDDMMAAAAToDisplay(dataCasamento)}) é posterior à data do divórcio (${formatDDMMAAAAToDisplay(dataAtoNotarial)}).`,
        field: 'dataCasamento',
      });
    } else if (diffDays <= 92) {
      // Menos de 3 meses (~92 dias)
      alerts.push({
        type: 'casamento_recente',
        severity: 'alerta',
        label: `Casamento muito recente (< 3 meses do divórcio): Casados em ${formatDDMMAAAAToDisplay(dataCasamento)} e divorciados em ${formatDDMMAAAAToDisplay(dataAtoNotarial)} (${Math.round(diffDays)} dias).`,
        field: 'dataCasamento',
      });
    }
  }

  // 8. Alerta: Casamento tem mais de 18 anos e é sem filhos
  if (dDivorcio && dCasam) {
    const diffYearsMarriage =
      (dDivorcio.getTime() - dCasam.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const semFilhos =
      (numFilhoMaior === '00' || numFilhoMaior === '99') &&
      (numFilhoMenor === '00' || numFilhoMenor === '99');

    if (diffYearsMarriage >= 18 && semFilhos) {
      alerts.push({
        type: 'casamento_longo_sem_filhos',
        severity: 'aviso',
        label: `Casamento com mais de 18 anos de duração (${Math.floor(diffYearsMarriage)} anos) sem filhos declarados. Verifique se há filhos maiores não informados.`,
        field: 'numFilhoMaior',
      });
    }
  }

  // 9. Alerta: Diferença de data de nascimento do casal superior a 10 anos
  if (dNasc1 && dNasc2) {
    const diffYearsAge = Math.abs(
      (dNasc1.getTime() - dNasc2.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    if (diffYearsAge > 10) {
      alerts.push({
        type: 'diferenca_idade_maior_10',
        severity: 'aviso',
        label: `Diferença de idade do casal superior a 10 anos (${Math.floor(diffYearsAge)} anos de diferença entre cônjuges).`,
        field: 'dataNascimento',
      });
    }
  }

  // 10. Alerta: Data de nascimento e data de casamento inferior a 18 anos (cônjuge menor na data do casamento)
  if (dCasam) {
    const menoresNoCasam: string[] = [];
    if (dNasc1) {
      const age1AtCasam =
        (dCasam.getTime() - dNasc1.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age1AtCasam < 0) {
        menoresNoCasam.push(`Cônjuge 1 (data de nascimento posterior ao casamento - inconsistente)`);
      } else if (age1AtCasam < 18) {
        menoresNoCasam.push(`Cônjuge 1 (${Math.floor(age1AtCasam)} anos)`);
      }
    }
    if (dNasc2) {
      const age2AtCasam =
        (dCasam.getTime() - dNasc2.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age2AtCasam < 0) {
        menoresNoCasam.push(`Cônjuge 2 (data de nascimento posterior ao casamento - inconsistente)`);
      } else if (age2AtCasam < 18) {
        menoresNoCasam.push(`Cônjuge 2 (${Math.floor(age2AtCasam)} anos)`);
      }
    }
    if (menoresNoCasam.length > 0) {
      alerts.push({
        type: 'menor_18_no_casamento',
        severity: 'alerta',
        label: `Cônjuge menor de 18 anos na data do casamento: ${menoresNoCasam.join(', ')}.`,
        field: 'dataCasamento',
      });
    }
  }

  return alerts;
}

/**
 * Gera os cards descritivos de validação e estatísticas do lote de escrituras
 */
export function generateValidationSummary(
  escrituras: EscrituraRecord[],
  totalRawRows = escrituras.length * 2,
  ddi55CorrectedCount = 0
): ValidationItem[] {
  const validations: ValidationItem[] = [];

  if (escrituras.length === 0) {
    return [];
  }

  // Validations summary
  validations.push({
    id: 'val-total',
    tipo: 'sucesso',
    titulo: 'Processamento Concluído com Sucesso',
    mensagem: `${totalRawRows} registros de cônjuges consolidados em ${escrituras.length} escrituras de divórcio (Modelo 7 do IBGE).`,
  });

  // Alertas agregados solicitados pelo usuário
  const totalMesmoSexo = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'mesmo_sexo')
  ).length;

  if (totalMesmoSexo > 0) {
    validations.push({
      id: 'val-mesmo-sexo',
      tipo: 'aviso',
      titulo: `Atenção: ${totalMesmoSexo} escritura(s) com cônjuges do mesmo sexo`,
      mensagem: `Detectamos ${totalMesmoSexo} escritura(s) onde ambos os cônjuges possuem o mesmo sexo cadastrado. Verifique se trata-se de união homoafetiva ou se houve equívoco na digitação dos dados do cartório.`,
    });
  }

  const totalSemRegime = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_regime')
  ).length;

  if (totalSemRegime > 0) {
    validations.push({
      id: 'val-sem-regime',
      tipo: 'aviso',
      titulo: `Alerta: ${totalSemRegime} escritura(s) sem regime de bens informado`,
      mensagem: `Nessas escrituras, o regime de bens constará com o código 9 ("Sem declaração") conforme o manual do IBGE.`,
    });
  }

  const totalSemDataCasamento = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_data_casamento')
  ).length;

  if (totalSemDataCasamento > 0) {
    validations.push({
      id: 'val-sem-data-casamento',
      tipo: 'aviso',
      titulo: `Alerta: ${totalSemDataCasamento} escritura(s) sem data de casamento`,
      mensagem: `A data de casamento não informada foi preenchida com "99999999" conforme a Regra 9 do IBGE.`,
    });
  }

  const totalSemDataNasc = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_data_nascimento')
  ).length;

  if (totalSemDataNasc > 0) {
    validations.push({
      id: 'val-sem-data-nasc',
      tipo: 'aviso',
      titulo: `Alerta: ${totalSemDataNasc} escritura(s) com data de nascimento faltante`,
      mensagem: `Cônjuges sem data de nascimento gravados com "99999999".`,
    });
  }

  const totalSemCidadeNasc = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_cidade_nascimento')
  ).length;

  if (totalSemCidadeNasc > 0) {
    validations.push({
      id: 'val-sem-cidade-nasc',
      tipo: 'aviso',
      titulo: `Alerta: ${totalSemCidadeNasc} escritura(s) com cidade de nascimento não informada`,
      mensagem: `Município de nascimento não informado gravado como "99999" (Ignorado).`,
    });
  }

  const totalSemCidadeRes = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_cidade_residencia')
  ).length;

  if (totalSemCidadeRes > 0) {
    validations.push({
      id: 'val-sem-cidade-res',
      tipo: 'aviso',
      titulo: `Alerta: ${totalSemCidadeRes} escritura(s) com cidade de residência não informada`,
      mensagem: `Município de residência não informado gravado como "99999" (Ignorado).`,
    });
  }

  const totalCasamentoRecente = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'casamento_recente')
  ).length;

  if (totalCasamentoRecente > 0) {
    validations.push({
      id: 'val-casamento-recente',
      tipo: 'aviso',
      titulo: `Atenção: ${totalCasamentoRecente} escritura(s) com casamento recente (< 3 meses)`,
      mensagem: `Detectadas escrituras onde o casamento ocorreu há menos de 3 meses da data do divórcio. Verifique se as datas foram digitadas corretamente.`,
    });
  }

  const totalLongoSemFilhos = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'casamento_longo_sem_filhos')
  ).length;

  if (totalLongoSemFilhos > 0) {
    validations.push({
      id: 'val-longo-sem-filhos',
      tipo: 'info',
      titulo: `Auditoria: ${totalLongoSemFilhos} escritura(s) com mais de 18 anos de casamento e sem filhos declarados`,
      mensagem: `Casamentos com mais de 18 anos sem filhos. Recomenda-se conferir se filhos maiores foram omitidos na certidão.`,
    });
  }

  const totalIdadeMais10 = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'diferenca_idade_maior_10')
  ).length;

  if (totalIdadeMais10 > 0) {
    validations.push({
      id: 'val-idade-mais-10',
      tipo: 'info',
      titulo: `Auditoria: ${totalIdadeMais10} casal(is) com diferença de idade superior a 10 anos`,
      mensagem: `Diferença superior a 10 anos entre as datas de nascimento dos cônjuges. Verifique para garantir que os anos de nascimento não foram trocados.`,
    });
  }

  const totalMenor18Casam = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'menor_18_no_casamento')
  ).length;

  if (totalMenor18Casam > 0) {
    validations.push({
      id: 'val-menor-18-casam',
      tipo: 'aviso',
      titulo: `Atenção: ${totalMenor18Casam} cônjuge(s) menor(es) de 18 anos na data do casamento`,
      mensagem: `Cônjuges com menos de 18 anos de idade na data em que o casamento foi realizado.`,
    });
  }

  if (ddi55CorrectedCount > 0) {
    validations.push({
      id: 'val-pais',
      tipo: 'info',
      titulo: 'Regra 10 do IBGE Aplicada aos Países',
      mensagem: `O valor "55" (DDI telefônico do Brasil) foi convertido para "999" conforme a Regra 10 do manual do IBGE ("Não utilizar 076. Deverá ser utilizado 999").`,
    });
  }

  const dupes = escrituras.filter((e) => e.isDuplicate).length;
  if (dupes > 0) {
    validations.push({
      id: 'val-dupes',
      tipo: 'aviso',
      titulo: 'Registros com Chaves Repetidas Detectados',
      mensagem: `${dupes} escrituras possuem chaves repetidas (mesmo livro/folha). Isso será contabilizado em TOTAL-REPETIDOS no TABINF12.TXT.`,
    });
  }

  return validations;
}

/**
 * Processa uma lista de RawCsvRow (extraída de CSV ou XLSX) para escrituras e validações
 */
export function parseRawRowsToEscrituras(
  rawRows: RawCsvRow[],
  config: CartorioConfig = DEFAULT_CONFIG
): { escrituras: EscrituraRecord[]; validations: ValidationItem[] } {
  if (rawRows.length === 0) {
    return { escrituras: [], validations: [] };
  }

  // Agrupamento por Escritura (Livro + Folha + Data)
  // Cada escritura no TABINF07.TXT possui Cônjuge 1 e Cônjuge 2
  const groupedMap = new Map<string, RawCsvRow[]>();

  rawRows.forEach((r) => {
    // Chave de agrupamento: Livro + Folha + Data
    const key = `${r.livro.toUpperCase()}__${r.folha.toUpperCase()}__${r.data}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(r);
  });

  const escrituras: EscrituraRecord[] = [];
  let ddi55CorrectedCount = 0;

  groupedMap.forEach((rows) => {
    if (rows.length === 0) return;

    // Normalizar Cônjuge 1 e Cônjuge 2
    let c1Row: RawCsvRow = rows[0];
    let c2Row: RawCsvRow = rows.length > 1 ? rows[1] : rows[0];

    // Se houver indicação explícita da coluna Cônjuge (1 ou 2)
    const rowForC1 = rows.find((r) => r.conjugeNum === '1');
    const rowForC2 = rows.find((r) => r.conjugeNum === '2');

    if (rowForC1 && rowForC2) {
      c1Row = rowForC1;
      c2Row = rowForC2;
    } else if (rowForC1 && rows.length > 1) {
      c1Row = rowForC1;
      c2Row = rows.find((r) => r !== rowForC1) || rows[1];
    } else if (rowForC2 && rows.length > 1) {
      c2Row = rowForC2;
      c1Row = rows.find((r) => r !== rowForC2) || rows[0];
    }

    // Regime de bens
    const regimeInfo = parseRegimeBens(c1Row.regime || c2Row.regime);

    // Datas
    const dataAbertura = formatDataToDDMMAAAA(c1Row.data || c2Row.data);
    const dataAtoNotarial = formatDataToDDMMAAAA(c1Row.data || c2Row.data);
    const dataCasamento = formatDataToDDMMAAAA(c1Row.dataCasamento || c2Row.dataCasamento);

    // Filhos
    const rawMaior = (c1Row.filhosMaior || c2Row.filhosMaior || '').trim();
    const rawMenor = (c1Row.filhosMenor || c2Row.filhosMenor || '').trim();

    let numFilhoMaior = '99';
    if (rawMaior) {
      const parsed = parseInt(rawMaior, 10);
      numFilhoMaior = isNaN(parsed) ? '99' : parsed.toString().padStart(2, '0');
    } else if (!config.emptyChildrenAs99) {
      numFilhoMaior = '00';
    }

    let numFilhoMenor = '99';
    if (rawMenor) {
      const parsed = parseInt(rawMenor, 10);
      numFilhoMenor = isNaN(parsed) ? '99' : parsed.toString().padStart(2, '0');
    } else if (!config.emptyChildrenAs99) {
      numFilhoMenor = '00';
    }

    // Responsável pelos filhos
    let codRespFilho = '9';
    const rawResp = (c1Row.respFilhos || c2Row.respFilhos || '').trim();
    if (rawResp && ['1', '2', '3', '4', '9'].includes(rawResp)) {
      codRespFilho = rawResp;
    }

    // Folhas (Item 6.2 #8 e #9: Quando existir somente a folha inicial, repeti-la no número final)
    const folhaClean = (c1Row.folha || c2Row.folha || '').replace(/\D/g, '');
    const folhaInicial = folhaClean ? folhaClean.padStart(4, '0') : '0001';
    const folhaFinal = folhaInicial;

    // Cônjuge 1
    const ufNasc1 = parseUfCode(c1Row.ufNas);
    const codMunNasc1 = parseMunCode(c1Row.codmunNas, ufNasc1);
    const codPaisNasc1 = parsePaisCode(ufNasc1, c1Row.paisNas);

    const ufRes1 = parseUfCode(c1Row.ufRes);
    const codMunRes1 = parseMunCode(c1Row.codmunRes, ufRes1);
    const codPaisRes1 = parsePaisCode(ufRes1, c1Row.paisRes);

    const conjuge1: ConjugeData = {
      nome: c1Row.nome || 'Cônjuge 1',
      sexo: parseSexo(c1Row.sexo),
      dataNascimento: formatDataToDDMMAAAA(c1Row.dataNascimento),
      dataNascimentoOriginal: c1Row.dataNascimento || '',
      cidadeNasc: c1Row.nascidoEm || '',
      ufNasc: ufNasc1,
      codMunNasc: codMunNasc1,
      codPaisNasc: codPaisNasc1,
      cidadeRes: c1Row.residencia || '',
      ufRes: ufRes1,
      codMunRes: codMunRes1,
      codPaisRes: codPaisRes1,
    };

    // Cônjuge 2
    const ufNasc2 = parseUfCode(c2Row.ufNas);
    const codMunNasc2 = parseMunCode(c2Row.codmunNas, ufNasc2);
    const codPaisNasc2 = parsePaisCode(ufNasc2, c2Row.paisNas);

    const ufRes2 = parseUfCode(c2Row.ufRes);
    const codMunRes2 = parseMunCode(c2Row.codmunRes, ufRes2);
    const codPaisRes2 = parsePaisCode(ufRes2, c2Row.paisRes);

    const conjuge2: ConjugeData = {
      nome: c2Row.nome || 'Cônjuge 2',
      sexo: parseSexo(c2Row.sexo),
      dataNascimento: formatDataToDDMMAAAA(c2Row.dataNascimento),
      dataNascimentoOriginal: c2Row.dataNascimento || '',
      cidadeNasc: c2Row.nascidoEm || '',
      ufNasc: ufNasc2,
      codMunNasc: codMunNasc2,
      codPaisNasc: codPaisNasc2,
      cidadeRes: c2Row.residencia || '',
      ufRes: ufRes2,
      codMunRes: codMunRes2,
      codPaisRes: codPaisRes2,
    };

    if (
      c1Row.paisNas === '55' ||
      c1Row.paisRes === '55' ||
      c2Row.paisNas === '55' ||
      c2Row.paisRes === '55'
    ) {
      ddi55CorrectedCount++;
    }

    // Chave de identificação da escritura (item 5.2 #8):
    // uf-pesquisa, mun-pesquisa, dist-pesquisa, cod-cartorio, ano-pesquisa, trim-pesquisa,
    // num-livro, num-inicial-folha, num-final-folha e compl-folha
    const livroStr = (c1Row.livro || c2Row.livro || '').toUpperCase().trim();
    const complFolha = '9'; // 9 = Sem complemento

    const chave = `${config.ufPesquisa}-${config.munPesquisa}-${config.distPesquisa}-${config.codCartorio}-${config.anoPesquisa}-${config.trimPesquisa}-${livroStr}-${folhaInicial}-${folhaFinal}-${complFolha}`;

    const baseEscritura = {
      id: `esc-${escrituras.length + 1}`,
      livro: livroStr,
      folhaInicial,
      folhaFinal,
      complFolha,
      dataAbertura,
      dataAtoNotarial,
      dataCasamento,
      regimeBens: regimeInfo.code,
      regimeBensNome: regimeInfo.label,
      numFilhoMaior,
      numFilhoMenor,
      codRespFilho,
      conjuge1,
      conjuge2,
      chaveIdentificacao: chave,
    };

    const alerts = computeEscrituraAlerts(baseEscritura);

    escrituras.push({
      ...baseEscritura,
      alerts,
    });
  });

  // Identificar duplicados
  const chaveCounts = new Map<string, number>();
  escrituras.forEach((e) => {
    chaveCounts.set(e.chaveIdentificacao, (chaveCounts.get(e.chaveIdentificacao) || 0) + 1);
  });

  escrituras.forEach((e) => {
    if ((chaveCounts.get(e.chaveIdentificacao) || 0) > 1) {
      e.isDuplicate = true;
    }
  });

  const validations = generateValidationSummary(escrituras, rawRows.length, ddi55CorrectedCount);

  return { escrituras, validations };
}

/**
 * Parse das linhas CSV para pares de cônjuges (Escrituras)
 */
export function parseCsvToEscrituras(
  csvContent: string,
  config: CartorioConfig = DEFAULT_CONFIG
): { escrituras: EscrituraRecord[]; validations: ValidationItem[] } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { escrituras: [], validations: [] };
  }

  // Detect delimiter (; or ,)
  const firstLine = lines[0];
  const delimiter = firstLine.split(';').length >= firstLine.split(',').length ? ';' : ',';

  // Read header
  const headerTokens = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());
  const hasHeader =
    headerTokens.some((t) => t.includes('livro')) ||
    headerTokens.some((t) => t.includes('folha')) ||
    headerTokens.some((t) => t.includes('nome'));

  const dataRows: string[] = hasHeader ? lines.slice(1) : lines;

  // Agrupar linhas brutas
  const rawRows: RawCsvRow[] = [];

  for (let idx = 0; idx < dataRows.length; idx++) {
    const cols = dataRows[idx].split(delimiter).map((c) => c.trim());
    if (cols.length < 5) continue;

    const row: RawCsvRow = {
      livro: cols[0] || '',
      folha: cols[1] || '',
      data: cols[3] || '',
      conjugeNum: cols[4] || '',
      sexo: cols[5] || '',
      cesdi: cols[6] || '',
      nome: cols[7] || '',
      dataCasamento: cols[8] || '',
      regime: cols[9] || '',
      filhosMaior: cols[10] || '',
      filhosMenor: cols[11] || '',
      respFilhos: cols[12] || '',
      dataNascimento: cols[13] || '',
      nascidoEm: cols[14] || '',
      codmunNas: cols[15] || '',
      ufNas: cols[16] || '',
      paisNas: cols[17] || '',
      residencia: cols[18] || '',
      ufRes: cols[19] || '',
      codmunRes: cols[20] || '',
      paisRes: cols[21] || '',
    };
    rawRows.push(row);
  }

  return parseRawRowsToEscrituras(rawRows, config);
}

/**
 * Converte um registro de escritura para a linha oficial do TABINF07.TXT
 * Exatos 121 bytes!
 */
export function buildTabinf07Row(
  escritura: EscrituraRecord,
  config: CartorioConfig
): Tabinf07Row {
  // Campo 01: UF-PESQUISA - CHAR 02
  const ufPesquisa = config.ufPesquisa.padStart(2, '0').substring(0, 2);

  // Campo 02: MUN-PESQUISA - CHAR 05
  const munPesquisa = config.munPesquisa.padStart(5, '0').substring(0, 5);

  // Campo 03: DIST-PESQUISA - CHAR 02
  const distPesquisa = config.distPesquisa.padStart(2, '0').substring(0, 2);

  // Campo 04: COD_CARTORIO - CHAR 02
  const codCartorio = config.codCartorio.padStart(2, '0').substring(0, 2);

  // Campo 05: ANO-PESQUISA - CHAR 04
  const anoPesquisa = config.anoPesquisa.padStart(4, '0').substring(0, 4);

  // Campo 06: TRIM-PESQUISA - CHAR 01
  const trimPesquisa = config.trimPesquisa.substring(0, 1);

  // Campo 07: NUM-LIVRO - CHAR 18 (Alfanumérico: espaços em branco à direita)
  const numLivro = escritura.livro.padEnd(18, ' ').substring(0, 18);

  // Campo 08: NUM-INICIAL-FOLHA - CHAR 04 (Numérico: zeros à esquerda)
  const numInicialFolha = escritura.folhaInicial.padStart(4, '0').substring(0, 4);

  // Campo 09: NUM-FINAL-FOLHA - CHAR 04 (Numérico: zeros à esquerda)
  const numFinalFolha = (escritura.folhaFinal || escritura.folhaInicial)
    .padStart(4, '0')
    .substring(0, 4);

  // Campo 10: COMPL-FOLHA - CHAR 01 (1=Frente, 2=Verso, 9=Sem complemento)
  const complFolha = (escritura.complFolha || '9').substring(0, 1);

  // Campo 11: DATA-ABERT-ESCRIT - CHAR 08 (DDMMAAAA)
  const dataAbertEscrit = escritura.dataAbertura.padStart(8, '9').substring(0, 8);

  // Campo 12: DATA-ATO-NOTARIAL - CHAR 08 (DDMMAAAA)
  const dataAtoNotarial = escritura.dataAtoNotarial.padStart(8, '9').substring(0, 8);

  // Campo 13: DATA-CASAMENTO - CHAR 08 (DDMMAAAA)
  const dataCasamento = (escritura.dataCasamento || '99999999')
    .padStart(8, '9')
    .substring(0, 8);

  // Campo 14: REGIME-BENS - CHAR 01 (1, 2, 3, 9)
  const regimeBens = (escritura.regimeBens || '9').substring(0, 1);

  // Campo 15: NUM-FILHO-MAIOR - CHAR 02 (Numérico: zeros à esquerda ou 99)
  const numFilhoMaior = escritura.numFilhoMaior.padStart(2, '9').substring(0, 2);

  // Campo 16: NUM-FILHO-MENOR - CHAR 02 (Numérico: zeros à esquerda ou 99)
  const numFilhoMenor = escritura.numFilhoMenor.padStart(2, '9').substring(0, 2);

  // Campo 17: COD_RESP_FILHO - CHAR 01 (1, 2, 3, 4, 9)
  const codRespFilho = (escritura.codRespFilho || '9').substring(0, 1);

  // Campo 18: COD-UF-RES-CONJ1 - CHAR 02
  const codUfResConj1 = escritura.conjuge1.ufRes.padStart(2, '9').substring(0, 2);

  // Campo 19: COD-MUN-RES-CONJ1 - CHAR 05
  const codMunResConj1 = escritura.conjuge1.codMunRes.padStart(5, '9').substring(0, 5);

  // Campo 20: COD-PAIS-RES-CONJ1 - CHAR 03
  const codPaisResConj1 = escritura.conjuge1.codPaisRes.padStart(3, '9').substring(0, 3);

  // Campo 21: COD-UF-RES-CONJ2 - CHAR 02
  const codUfResConj2 = escritura.conjuge2.ufRes.padStart(2, '9').substring(0, 2);

  // Campo 22: COD-MUN-RES-CONJ2 - CHAR 05
  const codMunResConj2 = escritura.conjuge2.codMunRes.padStart(5, '9').substring(0, 5);

  // Campo 23: COD-PAIS-RES-CONJ2 - CHAR 03
  const codPaisResConj2 = escritura.conjuge2.codPaisRes.padStart(3, '9').substring(0, 3);

  // Campo 24: COD-UF-NASC-CONJ1 - CHAR 02
  const codUfNascConj1 = escritura.conjuge1.ufNasc.padStart(2, '9').substring(0, 2);

  // Campo 25: COD-PAIS-NASC-CONJ1 - CHAR 03
  const codPaisNascConj1 = escritura.conjuge1.codPaisNasc.padStart(3, '9').substring(0, 3);

  // Campo 26: COD-UF-NASC-CONJ2 - CHAR 02
  const codUfNascConj2 = escritura.conjuge2.ufNasc.padStart(2, '9').substring(0, 2);

  // Campo 27: COD-PAIS-NASC-CONJ2 - CHAR 03
  const codPaisNascConj2 = escritura.conjuge2.codPaisNasc.padStart(3, '9').substring(0, 3);

  // Campo 28: DATA-NASC-CONJ1 - CHAR 08 (DDMMAAAA)
  const dataNascConj1 = escritura.conjuge1.dataNascimento.padStart(8, '9').substring(0, 8);

  // Campo 29: DATA-NASC-CONJ2 - CHAR 08 (DDMMAAAA)
  const dataNascConj2 = escritura.conjuge2.dataNascimento.padStart(8, '9').substring(0, 8);

  // Campo 30: SEXO-CONJ1 - CHAR 01 (1, 2)
  const sexoConj1 = (escritura.conjuge1.sexo || '1').substring(0, 1);

  // Campo 31: SEXO-CONJ2 - CHAR 01 (1, 2)
  const sexoConj2 = (escritura.conjuge2.sexo || '2').substring(0, 1);

  // Concatenação exata
  const rawLine =
    ufPesquisa +
    munPesquisa +
    distPesquisa +
    codCartorio +
    anoPesquisa +
    trimPesquisa +
    numLivro +
    numInicialFolha +
    numFinalFolha +
    complFolha +
    dataAbertEscrit +
    dataAtoNotarial +
    dataCasamento +
    regimeBens +
    numFilhoMaior +
    numFilhoMenor +
    codRespFilho +
    codUfResConj1 +
    codMunResConj1 +
    codPaisResConj1 +
    codUfResConj2 +
    codMunResConj2 +
    codPaisResConj2 +
    codUfNascConj1 +
    codPaisNascConj1 +
    codUfNascConj2 +
    codPaisNascConj2 +
    dataNascConj1 +
    dataNascConj2 +
    sexoConj1 +
    sexoConj2;

  return {
    ufPesquisa,
    munPesquisa,
    distPesquisa,
    codCartorio,
    anoPesquisa,
    trimPesquisa,
    numLivro,
    numInicialFolha,
    numFinalFolha,
    complFolha,
    dataAbertEscrit,
    dataAtoNotarial,
    dataCasamento,
    regimeBens,
    numFilhoMaior,
    numFilhoMenor,
    codRespFilho,
    codUfResConj1,
    codMunResConj1,
    codPaisResConj1,
    codUfResConj2,
    codMunResConj2,
    codPaisResConj2,
    codUfNascConj1,
    codPaisNascConj1,
    codUfNascConj2,
    codPaisNascConj2,
    dataNascConj1,
    dataNascConj2,
    sexoConj1,
    sexoConj2,
    rawLine,
    nomeConj1: escritura.conjuge1.nome,
    nomeConj2: escritura.conjuge2.nome,
  };
}

/**
 * Constrói o Resumo (Recibo) TABINF12.TXT
 * Exatos 26 bytes!
 */
export function buildTabinf12Summary(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): Tabinf12Summary {
  const ufPesquisa = config.ufPesquisa.padStart(2, '0').substring(0, 2);
  const munPesquisa = config.munPesquisa.padStart(5, '0').substring(0, 5);
  const distPesquisa = config.distPesquisa.padStart(2, '0').substring(0, 2);
  const codCartorio = config.codCartorio.padStart(2, '0').substring(0, 2);
  const anoPesquisa = config.anoPesquisa.padStart(4, '0').substring(0, 4);
  const trimPesquisa = config.trimPesquisa.substring(0, 1);

  const totalRepetidosCount = escrituras.filter((e) => e.isDuplicate).length;
  // Total de escrituras válidas = Qtde Total - Total-Repetidos (conforme item 5.2 #7)
  const totalDivCount = escrituras.length - totalRepetidosCount;

  const totalDiv = totalDivCount.toString().padStart(6, '0').substring(0, 6);
  const totalRepetidos = totalRepetidosCount.toString().padStart(4, '0').substring(0, 4);

  const rawLine =
    ufPesquisa +
    munPesquisa +
    distPesquisa +
    codCartorio +
    anoPesquisa +
    trimPesquisa +
    totalDiv +
    totalRepetidos;

  return {
    ufPesquisa,
    munPesquisa,
    distPesquisa,
    codCartorio,
    anoPesquisa,
    trimPesquisa,
    totalDiv,
    totalRepetidos,
    rawLine,
  };
}
