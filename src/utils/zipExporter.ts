import JSZip from 'jszip';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import { buildTabinf07Row, buildTabinf12Summary } from './ibgeConverter';

export type CartinfProfileType =
  | 'hybrid_safe' // CONTROLE.SIS + CARTINF07 + CARTINF12 + TABINF07 + TABINF12
  | 'rcpn_completo' // CONTROLE.SIS + CARTINF01 a 04 + CARTINF07 + CARTINF10 + CARTINF12 (6+ arquivos)
  | 'cartinf_notarial' // CONTROLE.SIS + CARTINF07 + CARTINF12 (3 arquivos)
  | 'tabinf_original' // CONTROLE.SIS + TABINF07 + TABINF12 (3 arquivos)
  | 'custom_mirror'; // Espelha a lista de arquivos de um ZIP importado

export interface InspectedZipFile {
  name: string;
  size: number;
  linesCount: number;
  preview: string;
  detectedType: string;
}

export interface InspectedZipResult {
  fileName: string;
  totalFiles: number;
  files: InspectedZipFile[];
  hasControleSis: boolean;
  hasDivorcios: boolean;
  namingPrefix: 'CARTINF' | 'TABINF' | 'MISTO' | 'OUTRO';
  hasRcpnFiles: boolean;
  summary: string;
  suggestedProfile: CartinfProfileType;
}

/**
 * Concatena as linhas de 121 bytes de escrituras de divórcio (separador \r\n padrão Windows/DOS)
 */
export function generateTabinf07Content(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): string {
  const lines = escrituras.map((e) => {
    const row = buildTabinf07Row(e, config);
    return row.rawLine || '';
  });
  return lines.join('\r\n') + (lines.length > 0 ? '\r\n' : '');
}

/**
 * Gera o recibo oficial de divórcios (26 bytes)
 */
export function generateTabinf12Content(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): string {
  const summary = buildTabinf12Summary(escrituras, config);
  return summary.rawLine + '\r\n';
}

/**
 * Gera a Folha de Controle RC10 (72 bytes) do Registro Civil (CARTINF10.TXT)
 * Utilizada pelo validador do IBGE para checagem da quantidade e integridade dos mapas
 */
export function generateCartinf10Content(
  config: CartorioConfig,
  escrituras: EscrituraRecord[]
): string {
  const uf = config.ufPesquisa.padStart(2, '0').substring(0, 2);
  const mun = config.munPesquisa.padStart(5, '0').substring(0, 5);
  const dist = config.distPesquisa.padStart(2, '0').substring(0, 2);
  const cart = config.codCartorio.padStart(2, '0').substring(0, 2);
  const ano = config.anoPesquisa.padStart(4, '0').substring(0, 4);
  const trim = config.trimPesquisa.substring(0, 1);

  const totalRepetidosCount = escrituras.filter((e) => e.isDuplicate).length;
  const totalDivCount = escrituras.length - totalRepetidosCount;

  // Header 16 caracteres: UF(2) + MUN(5) + DIST(2) + CART(2) + ANO(4) + TRIM(1)
  const header = uf + mun + dist + cart + ano + trim;

  // Nascidos Vivos (0), Casamentos (0), Óbitos (0), Natimortos (0), Divórcios (totalDivCount)
  // Campos formatados com zeros à esquerda completando 72 caracteres
  const zeros = '000000';
  const divStr = totalDivCount.toString().padStart(6, '0').substring(0, 6);
  const repStr = totalRepetidosCount.toString().padStart(4, '0').substring(0, 4);

  // 16 chars header + 6*4 zeros para RC normais + 6 chars divórcios + 4 chars repetidos + preenchimento = 72 bytes
  const body = zeros + zeros + zeros + zeros + divStr + repStr;
  const line72 = (header + body).padEnd(72, '0').substring(0, 72);

  return line72 + '\r\n';
}

/**
 * Gera o pacote compactado CARTINF.ZIP de acordo com o perfil selecionado
 */
export async function generateCartinfZipBlob(
  escrituras: EscrituraRecord[],
  config: CartorioConfig,
  profile: CartinfProfileType = 'hybrid_safe',
  mirrorFileNames?: string[]
): Promise<Blob> {
  const zip = new JSZip();

  const content07 = generateTabinf07Content(escrituras, config);
  const content12 = generateTabinf12Content(escrituras, config);
  const content10 = generateCartinf10Content(config, escrituras);
  const controleSis = ''; // 0 byte físico conforme manual oficial

  if (profile === 'custom_mirror' && mirrorFileNames && mirrorFileNames.length > 0) {
    // Espelha EXATAMENTE os arquivos encontrados no ZIP do outro cartório
    for (const rawName of mirrorFileNames) {
      const upper = rawName.toUpperCase();
      if (upper === 'CONTROLE.SIS') {
        zip.file(rawName, controleSis);
      } else if (upper.includes('07') || upper.includes('DIV')) {
        zip.file(rawName, content07);
      } else if (upper.includes('12')) {
        zip.file(rawName, content12);
      } else if (upper.includes('10')) {
        zip.file(rawName, content10);
      } else {
        // Arquivos de outros atos (ex: CARTINF01 a 04 sem movimentação)
        zip.file(rawName, '');
      }
    }
  } else if (profile === 'rcpn_completo') {
    // Padrão com todos os 6 arquivos obrigatórios do Registro Civil + Divórcios:
    // Evita o erro: "Arquivo de formato inválido. Verificar se a quantidade de arquivos compactados esta incorreta."
    zip.file('CONTROLE.SIS', controleSis);
    zip.file('CARTINF01.TXT', ''); // Nascidos vivos (vazio para tabelionato)
    zip.file('CARTINF02.TXT', ''); // Casamentos (vazio para tabelionato)
    zip.file('CARTINF03.TXT', ''); // Óbitos (vazio para tabelionato)
    zip.file('CARTINF04.TXT', ''); // Natimortos (vazio para tabelionato)
    zip.file('CARTINF07.TXT', content07); // Divórcios em escrituras
    zip.file('CARTINF10.TXT', content10); // Folha de controle RC10 (72 bytes)
    zip.file('CARTINF12.TXT', content12); // Recibo do modelo 7 (26 bytes)
  } else if (profile === 'cartinf_notarial') {
    // 3 arquivos com prefixo CARTINF
    zip.file('CONTROLE.SIS', controleSis);
    zip.file('CARTINF07.TXT', content07);
    zip.file('CARTINF12.TXT', content12);
  } else if (profile === 'tabinf_original') {
    // 3 arquivos com prefixo TABINF (layout literal do manual de divórcios)
    zip.file('CONTROLE.SIS', controleSis);
    zip.file('TABINF07.TXT', content07);
    zip.file('TABINF12.TXT', content12);
  } else {
    // 'hybrid_safe' (Padrão Recomendado):
    // Inclui CONTROLE.SIS e os pares com prefixos CARTINF e TABINF para garantir
    // compatibilidade total independente de como o validador interno do IBGE busca os nomes
    zip.file('CONTROLE.SIS', controleSis);
    zip.file('CARTINF07.TXT', content07);
    zip.file('CARTINF12.TXT', content12);
    zip.file('TABINF07.TXT', content07);
    zip.file('TABINF12.TXT', content12);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Função mantida para retrocompatibilidade que gera o TABINF.ZIP
 */
export async function generateTabinfZipBlob(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): Promise<Blob> {
  return generateCartinfZipBlob(escrituras, config, 'tabinf_original');
}

/**
 * Inspeciona e analisa qualquer arquivo .ZIP fornecido pelo usuário
 * (ex: o arquivo gerado por outro cartório) para comparar estrutura e nomes de arquivos
 */
export async function inspectZipFile(file: File): Promise<InspectedZipResult> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(file);

  const files: InspectedZipFile[] = [];
  let hasControleSis = false;
  let hasDivorcios = false;
  let hasRcpnFiles = false;

  let cartinfCount = 0;
  let tabinfCount = 0;

  for (const [name, zipEntry] of Object.entries(loaded.files)) {
    if (zipEntry.dir) continue;

    const upper = name.toUpperCase();
    let detectedType = 'Arquivo de Dados';

    if (upper === 'CONTROLE.SIS') {
      hasControleSis = true;
      detectedType = 'Controle do IBGE (0 byte)';
    } else if (upper.includes('07') || upper.includes('DIV')) {
      hasDivorcios = true;
      detectedType = 'Escrituras de Divórcio (121 bytes/linha)';
    } else if (upper.includes('12')) {
      detectedType = 'Recibo de Divórcios (26 bytes)';
    } else if (upper.includes('10')) {
      detectedType = 'Folha de Controle RC-10 (72 bytes)';
      hasRcpnFiles = true;
    } else if (upper.includes('01')) {
      detectedType = 'Nascidos Vivos';
      hasRcpnFiles = true;
    } else if (upper.includes('02')) {
      detectedType = 'Casamentos';
      hasRcpnFiles = true;
    } else if (upper.includes('03')) {
      detectedType = 'Óbitos';
      hasRcpnFiles = true;
    } else if (upper.includes('04')) {
      detectedType = 'Natimortos / Óbitos Fetais';
      hasRcpnFiles = true;
    }

    if (upper.startsWith('CARTINF')) cartinfCount++;
    if (upper.startsWith('TABINF')) tabinfCount++;

    let textContent = '';
    try {
      textContent = await zipEntry.async('string');
    } catch {
      textContent = '';
    }

    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const sample = lines.slice(0, 3);

    // Tamanho do arquivo descompactado em bytes
    const byteLength = new TextEncoder().encode(textContent).length;

    files.push({
      name,
      size: byteLength,
      linesCount: lines.length,
      preview: sample.join('\n'),
      detectedType,
    });
  }

  // Identifica o padrão de nomenclatura
  let namingPrefix: 'CARTINF' | 'TABINF' | 'MISTO' | 'OUTRO' = 'OUTRO';
  if (cartinfCount > 0 && tabinfCount === 0) namingPrefix = 'CARTINF';
  else if (tabinfCount > 0 && cartinfCount === 0) namingPrefix = 'TABINF';
  else if (cartinfCount > 0 && tabinfCount > 0) namingPrefix = 'MISTO';

  // Sugestão de perfil com base no arquivo do outro cartório
  let suggestedProfile: CartinfProfileType = 'hybrid_safe';
  if (hasRcpnFiles || files.length >= 6) {
    suggestedProfile = 'rcpn_completo';
  } else if (namingPrefix === 'CARTINF') {
    suggestedProfile = 'cartinf_notarial';
  } else if (namingPrefix === 'TABINF') {
    suggestedProfile = 'tabinf_original';
  }

  const summary = `O arquivo possui ${files.length} arquivo(s) compactado(s) com prefixo ${namingPrefix}. ${
    hasControleSis ? 'Contém CONTROLE.SIS.' : 'Não contém CONTROLE.SIS.'
  } ${hasRcpnFiles ? 'Contém estrutura completa do Registro Civil (RCPN).' : 'Contém estrutura notarial.'}`;

  return {
    fileName: file.name,
    totalFiles: files.length,
    files,
    hasControleSis,
    hasDivorcios,
    namingPrefix,
    hasRcpnFiles,
    summary,
    suggestedProfile,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
