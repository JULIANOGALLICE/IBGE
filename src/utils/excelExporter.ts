import * as XLSX from 'xlsx';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import {
  buildTabinf07Row,
  buildTabinf12Summary,
  formatDDMMAAAAToDisplay,
} from './ibgeConverter';

export function generateIbgeExcelBlob(
  escrituras: EscrituraRecord[],
  config: CartorioConfig,
  rawCsvText?: string
): Blob {
  const wb = XLSX.utils.book_new();

  // 1. ABA 1: TABINF07 - Layout IBGE Oficial (31 Colunas com zeros preservados)
  const rows07 = escrituras.map((e) => buildTabinf07Row(e, config));

  const dataAba1 = rows07.map((r, index) => ({
    'Nº': (index + 1).toString(),
    'UF-PESQUISA': r.ufPesquisa,
    'MUN-PESQUISA': r.munPesquisa,
    'DIST-PESQUISA': r.distPesquisa,
    'COD_CARTORIO': r.codCartorio,
    'ANO-PESQUISA': r.anoPesquisa,
    'TRIM-PESQUISA': r.trimPesquisa,
    'NUM-LIVRO': r.numLivro.trim(),
    'NUM-INICIAL-FOLHA': r.numInicialFolha,
    'NUM-FINAL-FOLHA': r.numFinalFolha,
    'COMPL-FOLHA': r.complFolha,
    'DATA-ABERT-ESCRIT': r.dataAbertEscrit,
    'DATA-ATO-NOTARIAL': r.dataAtoNotarial,
    'DATA-CASAMENTO': r.dataCasamento,
    'REGIME-BENS': r.regimeBens,
    'NUM-FILHO-MAIOR': r.numFilhoMaior,
    'NUM-FILHO-MENOR': r.numFilhoMenor,
    'COD_RESP_FILHO': r.codRespFilho,
    'COD-UF-RES-CONJ1': r.codUfResConj1,
    'COD-MUN-RES-CONJ1': r.codMunResConj1,
    'COD-PAIS-RES-CONJ1': r.codPaisResConj1,
    'COD-UF-RES-CONJ2': r.codUfResConj2,
    'COD-MUN-RES-CONJ2': r.codMunResConj2,
    'COD-PAIS-RES-CONJ2': r.codPaisResConj2,
    'COD-UF-NASC-CONJ1': r.codUfNascConj1,
    'COD-PAIS-NASC-CONJ1': r.codPaisNascConj1,
    'COD-UF-NASC-CONJ2': r.codUfNascConj2,
    'COD-PAIS-NASC-CONJ2': r.codPaisNascConj2,
    'DATA-NASC-CONJ1': r.dataNascConj1,
    'DATA-NASC-CONJ2': r.dataNascConj2,
    'SEXO-CONJ1': r.sexoConj1,
    'SEXO-CONJ2': r.sexoConj2,
  }));

  const wsAba1 = XLSX.utils.json_to_sheet(dataAba1, { cellDates: false });
  // Forçar colunas de códigos e números com zeros a serem tratadas como texto no Excel
  const range1 = XLSX.utils.decode_range(wsAba1['!ref'] || 'A1:AG1');
  for (let R = range1.s.r + 1; R <= range1.e.r; ++R) {
    for (let C = range1.s.c; C <= range1.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (wsAba1[cellAddress]) {
        wsAba1[cellAddress].t = 's'; // tipo string para preservar zeros à esquerda ('06902', '0096', etc.)
      }
    }
  }
  XLSX.utils.book_append_sheet(wb, wsAba1, 'TABINF07 - Layout IBGE');

  // 2. ABA 2: Visão de Conferência com Nomes e Detalhes
  const dataAba2 = escrituras.map((e, index) => {
    const r = buildTabinf07Row(e, config);
    return {
      'Item': index + 1,
      'Livro': e.livro,
      'Folha Inicial': e.folhaInicial,
      'Folha Final': e.folhaFinal,
      'Data Escritura': formatDDMMAAAAToDisplay(e.dataAbertura),
      'Data Casamento': formatDDMMAAAAToDisplay(e.dataCasamento),
      'Regime de Bens': `${e.regimeBens} - ${e.regimeBensNome}`,
      'Filhos Maiores': e.numFilhoMaior === '99' ? 'Não declarado' : e.numFilhoMaior,
      'Filhos Menores': e.numFilhoMenor === '99' ? 'Não declarado' : e.numFilhoMenor,
      'Nome Cônjuge 1': e.conjuge1.nome,
      'Sexo Cônj. 1': e.conjuge1.sexo === '1' ? '1 (M)' : '2 (F)',
      'Nasc. Cônj. 1': formatDDMMAAAAToDisplay(e.conjuge1.dataNascimento),
      'Natural Cônj. 1': `${e.conjuge1.cidadeNasc} (${e.conjuge1.ufNasc})`,
      'Cod. Mun. Nasc 1': e.conjuge1.codMunNasc,
      'Resid. Cônj. 1': `${e.conjuge1.cidadeRes} (${e.conjuge1.ufRes})`,
      'Cod. Mun. Res 1': e.conjuge1.codMunRes,
      'País Res 1': e.conjuge1.codPaisRes,
      'Nome Cônjuge 2': e.conjuge2.nome,
      'Sexo Cônj. 2': e.conjuge2.sexo === '1' ? '1 (M)' : '2 (F)',
      'Nasc. Cônj. 2': formatDDMMAAAAToDisplay(e.conjuge2.dataNascimento),
      'Natural Cônj. 2': `${e.conjuge2.cidadeNasc} (${e.conjuge2.ufNasc})`,
      'Cod. Mun. Nasc 2': e.conjuge2.codMunNasc,
      'Resid. Cônj. 2': `${e.conjuge2.cidadeRes} (${e.conjuge2.ufRes})`,
      'Cod. Mun. Res 2': e.conjuge2.codMunRes,
      'País Res 2': e.conjuge2.codPaisRes,
      'Linha TXT TABINF07 (121 bytes)': r.rawLine,
    };
  });

  const wsAba2 = XLSX.utils.json_to_sheet(dataAba2);
  XLSX.utils.book_append_sheet(wb, wsAba2, 'Conferência de Escrituras');

  // 3. ABA 3: TABINF12 - Recibo (Resumo dos Dados)
  const resumo = buildTabinf12Summary(escrituras, config);
  const dataAba3 = [
    {
      'Nº Campo': '1',
      'Nome do Campo': 'UF-PESQUISA',
      'Descrição': 'Unidade da Federação fornecida pelo IBGE',
      'Tipo': 'CHAR (02)',
      'Valor Formatado': resumo.ufPesquisa,
    },
    {
      'Nº Campo': '2',
      'Nome do Campo': 'MUN-PESQUISA',
      'Descrição': 'Código do Município fornecido pelo IBGE',
      'Tipo': 'CHAR (05)',
      'Valor Formatado': resumo.munPesquisa,
    },
    {
      'Nº Campo': '3',
      'Nome do Campo': 'DIST-PESQUISA',
      'Descrição': 'Distrito fornecido pelo IBGE',
      'Tipo': 'CHAR (02)',
      'Valor Formatado': resumo.distPesquisa,
    },
    {
      'Nº Campo': '4',
      'Nome do Campo': 'COD_CARTORIO',
      'Descrição': 'Código do Cartório fornecido pelo IBGE',
      'Tipo': 'CHAR (02)',
      'Valor Formatado': resumo.codCartorio,
    },
    {
      'Nº Campo': '5',
      'Nome do Campo': 'ANO-PESQUISA',
      'Descrição': 'Ano de referência da pesquisa',
      'Tipo': 'CHAR (04)',
      'Valor Formatado': resumo.anoPesquisa,
    },
    {
      'Nº Campo': '6',
      'Nome do Campo': 'TRIM-PESQUISA',
      'Descrição': 'Trimestre de referência (1, 2, 3 ou 4)',
      'Tipo': 'CHAR (01)',
      'Valor Formatado': resumo.trimPesquisa,
    },
    {
      'Nº Campo': '7',
      'Nome do Campo': 'TOTAL-DIV',
      'Descrição': 'Total de Escrituras válidas (Qtde Total - Repetidos)',
      'Tipo': 'CHAR (06)',
      'Valor Formatado': resumo.totalDiv,
    },
    {
      'Nº Campo': '8',
      'Nome do Campo': 'TOTAL-REPETIDOS',
      'Descrição': 'Escrituras que possuem mesma chave identificadora',
      'Tipo': 'CHAR (04)',
      'Valor Formatado': resumo.totalRepetidos,
    },
    {
      'Nº Campo': '-',
      'Nome do Campo': 'LINHA_RAW_26_BYTES',
      'Descrição': 'Linha exata de 26 bytes gravada no arquivo TABINF12.TXT',
      'Tipo': 'CHAR (26)',
      'Valor Formatado': resumo.rawLine,
    },
  ];

  const wsAba3 = XLSX.utils.json_to_sheet(dataAba3);
  XLSX.utils.book_append_sheet(wb, wsAba3, 'TABINF12 - Recibo Resumo');

  // 4. ABA 4: Dicionário de Parâmetros do PDF
  const dataDicionario = [
    {
      'Nº': '1',
      'Nome': 'UF-PESQUISA',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'UF fornecida pelo IBGE (ex: 41 para PR)',
      'Regras': '2 dígitos numéricos com zero à esquerda',
    },
    {
      'Nº': '2',
      'Nome': 'MUN-PESQUISA',
      'Tipo': 'CHAR',
      'Tamanho': '05',
      'Descrição': 'Município fornecido pelo IBGE (ex: 06902 para Curitiba)',
      'Regras': '5 dígitos numéricos com zeros à esquerda',
    },
    {
      'Nº': '3',
      'Nome': 'DIST-PESQUISA',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'Distrito fornecido pelo IBGE',
      'Regras': '2 dígitos',
    },
    {
      'Nº': '4',
      'Nome': 'COD_CARTORIO',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'Código do cartório fornecido pelo IBGE',
      'Regras': '2 dígitos',
    },
    {
      'Nº': '5',
      'Nome': 'ANO-PESQUISA',
      'Tipo': 'CHAR',
      'Tamanho': '04',
      'Descrição': 'Ano da pesquisa',
      'Regras': '4 dígitos (ex: 2026)',
    },
    {
      'Nº': '6',
      'Nome': 'TRIM-PESQUISA',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Trimestre da pesquisa',
      'Regras': 'Valores válidos: 1, 2, 3 ou 4',
    },
    {
      'Nº': '7',
      'Nome': 'NUM-LIVRO',
      'Tipo': 'CHAR',
      'Tamanho': '18',
      'Descrição': 'Número do livro de registro',
      'Regras': 'Alfanumérico: espaços em branco à direita',
    },
    {
      'Nº': '8',
      'Nome': 'NUM-INICIAL-FOLHA',
      'Tipo': 'CHAR',
      'Tamanho': '04',
      'Descrição': 'Folha inicial do livro',
      'Regras': 'Numérico de 4 posições com zeros à esquerda',
    },
    {
      'Nº': '9',
      'Nome': 'NUM-FINAL-FOLHA',
      'Tipo': 'CHAR',
      'Tamanho': '04',
      'Descrição': 'Folha final do livro (repetir a inicial se única)',
      'Regras': 'Numérico de 4 posições com zeros à esquerda',
    },
    {
      'Nº': '10',
      'Nome': 'COMPL-FOLHA',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Complemento da folha',
      'Regras': '1 = Frente; 2 = Verso; 9 = Sem complemento',
    },
    {
      'Nº': '11',
      'Nome': 'DATA-ABERT-ESCRIT',
      'Tipo': 'CHAR',
      'Tamanho': '08',
      'Descrição': 'Data de abertura da escritura',
      'Regras': 'Formato DDMMAAAA (DIA, MÊS e ANO)',
    },
    {
      'Nº': '12',
      'Nome': 'DATA-ATO-NOTARIAL',
      'Tipo': 'CHAR',
      'Tamanho': '08',
      'Descrição': 'Data do ato notarial',
      'Regras': 'Formato DDMMAAAA. Deve coincidir com o trimestre',
    },
    {
      'Nº': '13',
      'Nome': 'DATA-CASAMENTO',
      'Tipo': 'CHAR',
      'Tamanho': '08',
      'Descrição': 'Data do casamento',
      'Regras': 'Formato DDMMAAAA ou 99999999 se ausente',
    },
    {
      'Nº': '14',
      'Nome': 'REGIME-BENS',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Regime de bens adotado no casamento',
      'Regras': '1 = Universal; 2 = Parcial; 3 = Separação; 9 = Sem declaração',
    },
    {
      'Nº': '15',
      'Nome': 'NUM-FILHO-MAIOR',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'Número de filhos maiores do casal',
      'Regras': '2 dígitos numéricos ou 99 se sem informação',
    },
    {
      'Nº': '16',
      'Nome': 'NUM-FILHO-MENOR',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'Número de filhos menores do casal',
      'Regras': '2 dígitos numéricos ou 99 se sem informação',
    },
    {
      'Nº': '17',
      'Nome': 'COD_RESP_FILHO',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Responsável pela guarda dos menores',
      'Regras': '1=Cônjuge 1; 2=Cônjuge 2; 3=Ambos; 4=Outro; 9=Sem declaração',
    },
    {
      'Nº': '18',
      'Nome': 'COD-UF-RES-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'UF de Residência Cônjuge 1',
      'Regras': 'Código IBGE da UF (ex: 41) ou 98 (Estr) / 99 (Ign)',
    },
    {
      'Nº': '19',
      'Nome': 'COD-MUN-RES-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '05',
      'Descrição': 'Município de Residência Cônjuge 1',
      'Regras': '5 dígitos da tabela IBGE ou 99999',
    },
    {
      'Nº': '20',
      'Nome': 'COD-PAIS-RES-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '03',
      'Descrição': 'País de Residência Cônjuge 1',
      'Regras': '999 para Brasil ou código ONU de 3 dígitos se UF=98',
    },
    {
      'Nº': '21',
      'Nome': 'COD-UF-RES-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'UF de Residência Cônjuge 2',
      'Regras': 'Código IBGE da UF (ex: 41) ou 98 (Estr) / 99 (Ign)',
    },
    {
      'Nº': '22',
      'Nome': 'COD-MUN-RES-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '05',
      'Descrição': 'Município de Residência Cônjuge 2',
      'Regras': '5 dígitos da tabela IBGE ou 99999',
    },
    {
      'Nº': '23',
      'Nome': 'COD-PAIS-RES-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '03',
      'Descrição': 'País de Residência Cônjuge 2',
      'Regras': '999 para Brasil ou código ONU de 3 dígitos se UF=98',
    },
    {
      'Nº': '24',
      'Nome': 'COD-UF-NASC-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'UF de Nascimento Cônjuge 1',
      'Regras': 'Código IBGE da UF ou 98/99',
    },
    {
      'Nº': '25',
      'Nome': 'COD-PAIS-NASC-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '03',
      'Descrição': 'País de Nascimento Cônjuge 1',
      'Regras': '999 para Brasil ou código ONU',
    },
    {
      'Nº': '26',
      'Nome': 'COD-UF-NASC-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '02',
      'Descrição': 'UF de Nascimento Cônjuge 2',
      'Regras': 'Código IBGE da UF ou 98/99',
    },
    {
      'Nº': '27',
      'Nome': 'COD-PAIS-NASC-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '03',
      'Descrição': 'País de Nascimento Cônjuge 2',
      'Regras': '999 para Brasil ou código ONU',
    },
    {
      'Nº': '28',
      'Nome': 'DATA-NASC-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '08',
      'Descrição': 'Data de Nascimento Cônjuge 1',
      'Regras': 'Formato DDMMAAAA ou 99999999',
    },
    {
      'Nº': '29',
      'Nome': 'DATA-NASC-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '08',
      'Descrição': 'Data de Nascimento Cônjuge 2',
      'Regras': 'Formato DDMMAAAA ou 99999999',
    },
    {
      'Nº': '30',
      'Nome': 'SEXO-CONJ1',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Sexo Cônjuge 1',
      'Regras': '1 = Masculino; 2 = Feminino',
    },
    {
      'Nº': '31',
      'Nome': 'SEXO-CONJ2',
      'Tipo': 'CHAR',
      'Tamanho': '01',
      'Descrição': 'Sexo Cônjuge 2',
      'Regras': '1 = Masculino; 2 = Feminino',
    },
  ];

  const wsAba4 = XLSX.utils.json_to_sheet(dataDicionario);
  XLSX.utils.book_append_sheet(wb, wsAba4, 'Dicionário de Parâmetros');

  // 5. ABA 5: Dados Brutos Originais (se disponível)
  if (rawCsvText) {
    const rawLines = rawCsvText
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .map((line, idx) => ({ Linha: idx + 1, ConteudoCsv: line }));
    const wsAba5 = XLSX.utils.json_to_sheet(rawLines);
    XLSX.utils.book_append_sheet(wb, wsAba5, 'CSV Original');
  }

  // Gera o buffer em formato XLSX
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
