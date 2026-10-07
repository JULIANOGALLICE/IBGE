import * as XLSX from 'xlsx';
import { RawCsvRow } from '../types/ibge';

/**
 * Converte qualquer valor de data do Excel (Date, serial number, string) para DD/MM/AAAA
 */
export function normalizeExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';

  // Se já for objeto Date
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    // Usa UTC para evitar problemas de fuso horário
    const d = val.getUTCDate().toString().padStart(2, '0');
    const m = (val.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = val.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }

  // Se for número serial do Excel (ex: 45482)
  if (typeof val === 'number') {
    if (val > 1000) {
      try {
        const parsed = XLSX.SSF.parse_date_code(val);
        if (parsed) {
          const d = parsed.d.toString().padStart(2, '0');
          const m = parsed.m.toString().padStart(2, '0');
          const y = parsed.y;
          return `${d}/${m}/${y}`;
        }
      } catch (err) {
        // ignora
      }
    }
    return val.toString();
  }

  const str = String(val).trim();
  // Formato AAAA-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Formato DD/MM/AAAA
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  return str;
}

/**
 * Lê um arquivo Excel (.xlsx, .xls) e extrai as linhas no formato RawCsvRow
 */
export async function parseExcelFileToRawRows(file: File): Promise<{
  rawRows: RawCsvRow[];
  sheetName: string;
  totalRows: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: true,
  });

  const sheetName = workbook.SheetNames[0] || 'Planilha1';
  const worksheet = workbook.Sheets[sheetName];

  // Converte a planilha em matriz de linhas (array de arrays)
  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  if (!rows || rows.length === 0) {
    return { rawRows: [], sheetName, totalRows: 0 };
  }

  // Procura a linha de cabeçalho
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i];
    if (Array.isArray(r)) {
      const rowStr = r.map((c) => String(c || '').toLowerCase()).join(' ');
      if (
        rowStr.includes('livro') ||
        rowStr.includes('folha') ||
        rowStr.includes('cônjuge') ||
        rowStr.includes('conjuge') ||
        rowStr.includes('nome')
      ) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const headerRow = (rows[headerRowIndex] || []).map((c) =>
    String(c || '').trim().toLowerCase()
  );

  // Mapeia os índices das colunas pelos nomes dos cabeçalhos
  const findColIndex = (keywords: string[]): number => {
    return headerRow.findIndex((col) =>
      keywords.some((k) => col.includes(k.toLowerCase()))
    );
  };

  // Índices mapeados com fallback posicional
  let idxLivro = findColIndex(['livro']);
  let idxFolha = findColIndex(['folha']);
  let idxDataAto = findColIndex(['data da escritura', 'data do ato', 'data ato']);
  let idxConjugeNum = findColIndex(['cônjuge', 'conjuge', 'ordem cônjuge']);
  let idxSexo = findColIndex(['sexo']);
  let idxCesdi = findColIndex(['cesdi']);
  let idxNome = findColIndex(['nome', 'nome cônjuge', 'nome conjuge']);
  let idxDataCasam = findColIndex(['casamento', 'data casamento', 'data do casamento']);
  let idxRegime = findColIndex(['regime', 'regime de bens']);
  let idxFilhosMaior = findColIndex(['filhos >', 'filhos maior', 'filhos maiores', 'filhos_maior']);
  let idxFilhosMenor = findColIndex(['filhos <', 'filhos menor', 'filhos menores', 'filhos_menor']);
  let idxRespFilhos = findColIndex(['respfilhos', 'resp filhos', 'responsavel filhos', 'guarda']);
  let idxNascimento = findColIndex(['nascimento', 'data nascimento', 'data de nascimento', 'dtnasc']);
  let idxNascidoEm = findColIndex(['nascido em', 'naturalidade', 'cidade nascimento']);
  let idxCodmunNas = findColIndex(['codmunnas', 'cod mun nas', 'cod mun nascimento', 'codmun_nas']);
  let idxUfNas = findColIndex(['ufnas', 'uf nas', 'uf nascimento', 'uf_nas']);
  let idxPaisNas = findColIndex(['paisnas', 'pais nas', 'país nascimento', 'pais_nas']);
  let idxResidencia = findColIndex(['residência', 'residencia', 'cidade residencia']);
  let idxUfRes = findColIndex(['ufres', 'uf res', 'uf residência', 'uf']);
  let idxCodmunRes = findColIndex(['codmunres', 'cod mun res', 'codmun', 'cod mun']);
  let idxPaisRes = findColIndex(['paisres', 'pais res', 'país residência', 'pais_res']);

  // Fallbacks de posição padrão caso o arquivo não tenha cabeçalho padrão
  // Padrão do arquivo do usuário:
  // 0: Livro; 1: Folha; 2: vazio; 3: Data; 4: Cônjuge; 5: Sexo; 6: CESDI; 7: Nome; 8: Data Casam; 9: Regime;
  // 10: Filhos >; 11: Filhos <; 12: Respfilhos; 13: Nascimento; 14: Nascido em; 15: codmunNas; 16: UFNAS;
  // 17: PaisNas; 18: Residência; 19: UF; 20: Codmun; 21: PaisRes
  if (idxLivro === -1) idxLivro = 0;
  if (idxFolha === -1) idxFolha = 1;
  if (idxDataAto === -1) idxDataAto = 3;
  if (idxConjugeNum === -1) idxConjugeNum = 4;
  if (idxSexo === -1) idxSexo = 5;
  if (idxCesdi === -1) idxCesdi = 6;
  if (idxNome === -1) idxNome = 7;
  if (idxDataCasam === -1) idxDataCasam = 8;
  if (idxRegime === -1) idxRegime = 9;
  if (idxFilhosMaior === -1) idxFilhosMaior = 10;
  if (idxFilhosMenor === -1) idxFilhosMenor = 11;
  if (idxRespFilhos === -1) idxRespFilhos = 12;
  if (idxNascimento === -1) idxNascimento = 13;
  if (idxNascidoEm === -1) idxNascidoEm = 14;
  if (idxCodmunNas === -1) idxCodmunNas = 15;
  if (idxUfNas === -1) idxUfNas = 16;
  if (idxPaisNas === -1) idxPaisNas = 17;
  if (idxResidencia === -1) idxResidencia = 18;
  if (idxUfRes === -1) idxUfRes = 19;
  if (idxCodmunRes === -1) idxCodmunRes = 20;
  if (idxPaisRes === -1) idxPaisRes = 21;

  const rawRows: RawCsvRow[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const getCol = (idx: number): any => (idx >= 0 && idx < row.length ? row[idx] : '');

    const livro = String(getCol(idxLivro) || '').trim();
    const folha = String(getCol(idxFolha) || '').trim();
    const nome = String(getCol(idxNome) || '').trim();

    // Se linha vazia sem livro, folha e nome, ignora
    if (!livro && !folha && !nome) continue;

    const dataAto = normalizeExcelDate(getCol(idxDataAto));
    const dataCasamento = normalizeExcelDate(getCol(idxDataCasam));
    const dataNascimento = normalizeExcelDate(getCol(idxNascimento));

    const item: RawCsvRow = {
      livro,
      folha,
      data: dataAto,
      conjugeNum: String(getCol(idxConjugeNum) || '').trim(),
      sexo: String(getCol(idxSexo) || '').trim(),
      cesdi: String(getCol(idxCesdi) || '').trim(),
      nome,
      dataCasamento,
      regime: String(getCol(idxRegime) || '').trim(),
      filhosMaior: String(getCol(idxFilhosMaior) || '').trim(),
      filhosMenor: String(getCol(idxFilhosMenor) || '').trim(),
      respFilhos: String(getCol(idxRespFilhos) || '').trim(),
      dataNascimento,
      nascidoEm: String(getCol(idxNascidoEm) || '').trim(),
      codmunNas: String(getCol(idxCodmunNas) || '').trim(),
      ufNas: String(getCol(idxUfNas) || '').trim(),
      paisNas: String(getCol(idxPaisNas) || '').trim(),
      residencia: String(getCol(idxResidencia) || '').trim(),
      ufRes: String(getCol(idxUfRes) || '').trim(),
      codmunRes: String(getCol(idxCodmunRes) || '').trim(),
      paisRes: String(getCol(idxPaisRes) || '').trim(),
    };

    rawRows.push(item);
  }

  return { rawRows, sheetName, totalRows: rawRows.length };
}

/**
 * Gera um arquivo XLSX modelo (Template) com as colunas esperadas para o cartório preencher
 */
export function generateImportTemplateXlsx(): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Livro',
    'Folha',
    'Termo',
    'Data',
    'Cônjuge',
    'Sexo',
    'CESDI',
    'Nome',
    'Data Casamento',
    'Regime',
    'Filhos >',
    'Filhos <',
    'Respfilhos',
    'Nascimento',
    'Nascido em',
    'codmunNas',
    'UFNAS',
    'PaisNas',
    'Residência',
    'UF',
    'Codmun',
    'PaisRes',
  ];

  const sampleRows = [
    [
      '830N',
      '96',
      '',
      '09/07/2026',
      '1',
      'M',
      '2-04-00',
      'VICTOR HUGO GIESEL OLIVEIRA',
      '25/05/2026',
      'COMUNHÃO PARCIAL',
      '',
      '',
      '',
      '19/11/1999',
      'Curitiba',
      '41-0690.2',
      'PR',
      '55',
      'Curitiba',
      'PR',
      '41-0690.2',
      '55',
    ],
    [
      '830N',
      '96',
      '',
      '09/07/2026',
      '2',
      'F',
      '2-04-00',
      'GABRIELLA SANTOS GIESEL',
      '25/05/2026',
      'COMUNHÃO PARCIAL',
      '',
      '',
      '',
      '15/05/2003',
      'São Paulo',
      '35-5030.8',
      'SP',
      '55',
      'São Paulo',
      'SP',
      '35-5030.8',
      '55',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Define larguras amigáveis
  ws['!cols'] = [
    { wch: 10 }, // Livro
    { wch: 8 },  // Folha
    { wch: 8 },  // Termo
    { wch: 12 }, // Data
    { wch: 9 },  // Cônjuge
    { wch: 6 },  // Sexo
    { wch: 10 }, // CESDI
    { wch: 32 }, // Nome
    { wch: 14 }, // Data Casamento
    { wch: 20 }, // Regime
    { wch: 10 }, // Filhos >
    { wch: 10 }, // Filhos <
    { wch: 12 }, // Respfilhos
    { wch: 14 }, // Nascimento
    { wch: 22 }, // Nascido em
    { wch: 12 }, // codmunNas
    { wch: 8 },  // UFNAS
    { wch: 9 },  // PaisNas
    { wch: 22 }, // Residência
    { wch: 8 },  // UF
    { wch: 12 }, // Codmun
    { wch: 9 },  // PaisRes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Dados_Divórcios');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
