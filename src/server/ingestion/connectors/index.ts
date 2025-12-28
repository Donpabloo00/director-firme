/**
 * Exporturi centrale pentru toti connectorii
 */

export { ingestFromDataGov, parseDataGovCsv, insertFinancialDataWithProvenance } from './datagov';
export { ingestFromAnaf, insertFiscalStatus } from './anaf';
export { ingestFromOnrc, insertCompanyWithProvenance, insertShareholdersWithProvenance } from './onrc';

