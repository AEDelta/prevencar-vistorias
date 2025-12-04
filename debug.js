// Debug file - carrega ANTES do React
console.log('=== DEBUG INICIADO ===');

// Capturar erros ANTES do React
window.__debugErrors = [];

window.addEventListener('error', (e) => {
  const error = {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    stack: e.error?.stack
  };
  window.__debugErrors.push(error);
  console.error('❌ ERRO:', error);
});

window.addEventListener('unhandledrejection', (e) => {
  const error = {
    reason: e.reason?.message || e.reason,
    stack: e.reason?.stack
  };
  window.__debugErrors.push(error);
  console.error('❌ PROMISE REJECTION:', error);
});

// Interceptar console.error
const originalError = console.error;
console.error = function(...args) {
  window.__debugErrors.push({ type: 'console.error', args });
  originalError.apply(console, args);
};

console.log('✅ Debug listeners adicionados');
console.log('Versão Node:', process.version);
