const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'invoices.json');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'audit_log.json');

function readInvoices() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeInvoices(invoices) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2));
}

function readAuditLog() {
  try {
    const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeAuditLog(entries) {
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(entries, null, 2));
}

function appendAudit(entry) {
  const entries = readAuditLog();
  entries.push(entry);
  writeAuditLog(entries);
}

module.exports = { readInvoices, writeInvoices, readAuditLog, writeAuditLog, appendAudit };
