/** Map Lodop ADD_PRINT_BARCODE type to JsBarcode `format` */
export function mapLodopToJsBarcodeFormat(codeType?: string): string {
  const t = (codeType || '128Auto').trim();
  switch (t) {
    case 'EAN8':
      return 'EAN8';
    case 'EAN13':
      return 'EAN13';
    case 'UPC_A':
    case 'UPC_E0':
    case 'UPC_E1':
      return 'UPC';
    case 'Code39':
    case '39Extended':
      return 'CODE39';
    case 'MSI':
      return 'MSI';
    case 'Codabar':
      return 'codabar';
    case '2_5interleaved':
      return 'ITF';
    case '128A':
    case '128B':
    case '128C':
    case '128Auto':
    case 'EAN128A':
    case 'EAN128B':
    case 'EAN128C':
    case 'Code93':
    case '93Extended':
    case '2_5industrial':
    case '2_5matrix':
    case 'PostNet':
    case 'UPCsupp2':
    case 'UPCsupp5':
    default:
      return 'CODE128';
  }
}
