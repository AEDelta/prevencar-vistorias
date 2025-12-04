import React from 'react';

export const TestPage = () => {
  React.useEffect(() => {
    console.log('✅ TestPage montado com sucesso!');
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#354d81' }}>✅ React está funcionando!</h1>
      <p>Se você vê esta página, o React está renderizando corretamente.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Debug Info:</h2>
        <pre>{JSON.stringify({
          reactVersion: React.version,
          timestamp: new Date().toLocaleString('pt-BR'),
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        }, null, 2)}</pre>
      </div>

      <button 
        onClick={() => alert('✅ Clique funcionando!')}
        style={{
          padding: '10px 20px',
          marginTop: '20px',
          backgroundColor: '#354d81',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Clique para testar
      </button>
    </div>
  );
};
