import api from "../api";

/**
 * Lookup a scanned or manually entered serial for an invoice.
 * @param {Object} params
 * @param {string} params.serial - The scanned/entered serial (carton or unit).
 * @param {string|number} params.invoiceId - The target invoice id.
 */
export const lookupSerial = async ({ serial, invoiceId }) => {
  const payload = { serial, invoice_id: String(invoiceId) };
  const res = await api.post(`/panel/invoices/scan/lookup`, payload);
  return res?.data?.data;
};

/**
 * Finalize invoice with grouped pricing items
 * @param {Object} params
 * @param {string|number} params.invoiceId
 * @param {Array} params.items - Finalized items payload as per backend contract
 * @param {Array} [params.single_stems] - Optional single stems sales array
 */
export const finalizeInvoice = async ({ invoiceId, ...payload }) => {
  const res = await api.post(`/panel/invoices/${invoiceId}/finalize`, payload);
  return res?.data;
};

/**
 * Get invoice details with includes
 * @param {string|number} invoiceId - The invoice id
 */
export const getInvoiceDetails = async (invoiceId) => {
  const res = await api.get(`/panel/invoices/${invoiceId}`, {
    params: {
      'includes[]': ['creator', 'items', 'single_stems']
    }
  });
  return res?.data?.data;
};

/**
 * Update invoice items with ops
 * @param {Object} params
 * @param {string|number} params.invoiceId
 * @param {Array} [params.ops] - Operations for items (add/remove)
 * @param {Array} [params.single_stems] - Operations for single stems
 */
export const updateInvoiceItems = async ({ invoiceId, ...payload }) => {
  const res = await api.patch(`/panel/invoices/${invoiceId}/items`, payload);
  return res?.data;
};

export default {
  lookupSerial,
  finalizeInvoice,
  getInvoiceDetails,
  updateInvoiceItems,
};