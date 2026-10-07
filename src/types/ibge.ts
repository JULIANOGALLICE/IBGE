export interface RawCsvRow {
  livro: string;
  folha: string;
  data: string;
  conjugeNum: string; // '1' | '2' | ''
  sexo: string; // 'M' | 'F'
  cesdi?: string;
  nome: string;
  dataCasamento: string;
  regime: string;
  filhosMaior?: string;
  filhosMenor?: string;
  respFilhos?: string;
  dataNascimento: string;
  nascidoEm: string;
  codmunNas: string;
  ufNas: string;
  paisNas: string;
  residencia: string;
  ufRes: string;
  codmunRes: string;
  paisRes: string;
  [key: string]: any;
}

export interface ConjugeData {
  nome: string;
  sexo: string; // '1' (M) or '2' (F)
  dataNascimento: string; // DDMMAAAA
  dataNascimentoOriginal: string; // DD/MM/AAAA
  cidadeNasc: string;
  ufNasc: string; // 2 chars
  codMunNasc: string; // 5 chars (sempre 99999 se não Brasil)
  codPaisNasc: string; // 3 chars ('999' para Brasil)
  cidadeRes: string;
  ufRes: string; // 2 chars
  codMunRes: string; // 5 chars
  codPaisRes: string; // 3 chars ('999' para Brasil)
}

export interface EscrituraAlert {
  type:
    | 'mesmo_sexo'
    | 'sem_regime'
    | 'sem_data_casamento'
    | 'sem_data_nascimento'
    | 'sem_cidade_nascimento'
    | 'sem_cidade_residencia'
    | 'casamento_recente'
    | 'casamento_longo_sem_filhos'
    | 'diferenca_idade_maior_10'
    | 'menor_18_no_casamento';
  severity: 'alerta' | 'aviso' | 'info';
  label: string;
  field: string;
}

export interface EscrituraRecord {
  id: string;
  livro: string;
  folhaInicial: string;
  folhaFinal: string;
  complFolha: string; // '1'=Frente, '2'=Verso, '9'=Sem complemento
  dataAbertura: string; // DDMMAAAA
  dataAtoNotarial: string; // DDMMAAAA
  dataCasamento: string; // DDMMAAAA or '99999999'
  regimeBens: string; // '1'=Comunhão universal, '2'=Comunhão parcial, '3'=Separação, '9'=Sem declaração
  regimeBensNome: string;
  numFilhoMaior: string; // 2 digits (e.g. '00', '02', '99')
  numFilhoMenor: string; // 2 digits
  codRespFilho: string; // '1'=Cônjuge 1, '2'=Cônjuge 2, '3'=Ambos, '4'=Outro, '9'=Sem declaração
  conjuge1: ConjugeData;
  conjuge2: ConjugeData;
  // Metadata for checking duplicates
  chaveIdentificacao: string;
  isDuplicate?: boolean;
  alerts?: EscrituraAlert[];
}

export interface CartorioConfig {
  ufPesquisa: string; // 2 chars, e.g. '41' (PR)
  munPesquisa: string; // 5 chars, e.g. '06902' (Curitiba)
  distPesquisa: string; // 2 chars, e.g. '05' (Uberaba)
  codCartorio: string; // 2 chars, e.g. '19' (Serviço Distrital do Uberaba)
  nomeCartorio?: string; // 'SERVIÇO DISTRITAL DO UBERABA'
  anoPesquisa: string; // 4 chars, e.g. '2026'
  trimPesquisa: string; // 1 char, '1', '2', '3', '4'
  emptyChildrenAs99: boolean; // true = '99' when empty (per rule 9), false = '00'
}

export interface Tabinf07Row {
  ufPesquisa: string; // 01: CHAR 02
  munPesquisa: string; // 02: CHAR 05
  distPesquisa: string; // 03: CHAR 02
  codCartorio: string; // 04: CHAR 02
  anoPesquisa: string; // 05: CHAR 04
  trimPesquisa: string; // 06: CHAR 01
  numLivro: string; // 07: CHAR 18
  numInicialFolha: string; // 08: CHAR 04
  numFinalFolha: string; // 09: CHAR 04
  complFolha: string; // 10: CHAR 01
  dataAbertEscrit: string; // 11: CHAR 08
  dataAtoNotarial: string; // 12: CHAR 08
  dataCasamento: string; // 13: CHAR 08
  regimeBens: string; // 14: CHAR 01
  numFilhoMaior: string; // 15: CHAR 02
  numFilhoMenor: string; // 16: CHAR 02
  codRespFilho: string; // 17: CHAR 01
  codUfResConj1: string; // 18: CHAR 02
  codMunResConj1: string; // 19: CHAR 05
  codPaisResConj1: string; // 20: CHAR 03
  codUfResConj2: string; // 21: CHAR 02
  codMunResConj2: string; // 22: CHAR 05
  codPaisResConj2: string; // 23: CHAR 03
  codUfNascConj1: string; // 24: CHAR 02
  codPaisNascConj1: string; // 25: CHAR 03
  codUfNascConj2: string; // 26: CHAR 02
  codPaisNascConj2: string; // 27: CHAR 03
  dataNascConj1: string; // 28: CHAR 08
  dataNascConj2: string; // 29: CHAR 08
  sexoConj1: string; // 30: CHAR 01
  sexoConj2: string; // 31: CHAR 01

  // Linha formatada para TABINF07.TXT (exatos 121 bytes)
  rawLine?: string;
  // Nomes para conferência
  nomeConj1?: string;
  nomeConj2?: string;
}

export interface Tabinf12Summary {
  ufPesquisa: string; // CHAR 02
  munPesquisa: string; // CHAR 05
  distPesquisa: string; // CHAR 02
  codCartorio: string; // CHAR 02
  anoPesquisa: string; // CHAR 04
  trimPesquisa: string; // CHAR 01
  totalDiv: string; // CHAR 06 (zeros à esquerda)
  totalRepetidos: string; // CHAR 04 (zeros à esquerda)
  rawLine: string; // exatos 26 bytes
}

export interface ValidationItem {
  id: string;
  tipo: 'sucesso' | 'aviso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  detalhe?: string;
}
