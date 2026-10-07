import JSZip from 'jszip';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import { buildTabinf07Row, buildTabinf12Summary } from './ibgeConverter';

export function generateTabinf07Content(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): string {
  // Concatena as linhas de 121 bytes separadas por \r\n (padrão Windows utilizado pelos sistemas do IBGE)
  const lines = escrituras.map((e) => {
    const row = buildTabinf07Row(e, config);
    return row.rawLine || '';
  });
  return lines.join('\r\n') + (lines.length > 0 ? '\r\n' : '');
}

export function generateTabinf12Content(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): string {
  const summary = buildTabinf12Summary(escrituras, config);
  return summary.rawLine + '\r\n';
}

export async function generateTabinfZipBlob(
  escrituras: EscrituraRecord[],
  config: CartorioConfig
): Promise<Blob> {
  const zip = new JSZip();

  const tabinf07 = generateTabinf07Content(escrituras, config);
  const tabinf12 = generateTabinf12Content(escrituras, config);
  const controleSis = ''; // 0 byte conforme item 7 do layout

  zip.file('TABINF07.TXT', tabinf07);
  zip.file('TABINF12.TXT', tabinf12);
  zip.file('CONTROLE.SIS', controleSis);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
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
