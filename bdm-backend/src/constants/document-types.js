// ============================================
// FILE: src/constants/document-types.js
// ============================================

const DOCUMENT_TYPES = {
  OFFER_LETTER: 'offer_letter',
  NDA: 'nda',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  AGREEMENT: 'agreement',
  PROPOSAL: 'proposal',
  MEMO: 'memo',
  POLICY: 'policy'
};

const DOCUMENT_TYPE_LABELS = {
  offer_letter: 'Offer Letter',
  nda: 'Non-Disclosure Agreement',
  contract: 'Contract',
  invoice: 'Invoice',
  agreement: 'Agreement',
  proposal: 'Proposal',
  memo: 'Memorandum',
  policy: 'Policy Document'
};

const isValidDocumentType = (type) => {
  return Object.values(DOCUMENT_TYPES).includes(type);
};

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  isValidDocumentType
};