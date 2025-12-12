import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 index.tsx carregado');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Elemento root não encontrado!');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px">Erro: elemento root não encontrado</h1>';
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Root element encontrado');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ Root criada');

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ App renderizado');
} catch (error) {
  console.error('❌ Erro ao renderizar app:', error);
  rootElement.innerHTML = `<h1 style="color: red; padding: 20px">Erro: ${error instanceof Error ? error.message : String(error)}</h1>`;
}