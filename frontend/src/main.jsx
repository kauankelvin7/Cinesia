import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function hideSplash() {
  const splash = document.getElementById('pwa-splash');
  if (!splash) return;

  splash.style.opacity = '0';
  splash.style.visibility = 'hidden';
  window.setTimeout(() => splash.remove(), 500);
}

function BootFailure({ error }) {
  const message = error instanceof Error ? error.message : String(error || 'Erro desconhecido');

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section style={{ maxWidth: 640 }}>
        <p style={{ color: '#5eead4', fontWeight: 700 }}>Cinesia</p>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '8px 0 16px' }}>
          Não foi possível iniciar a aplicação.
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Recarregue a página. Se o problema continuar, copie a mensagem abaixo para o suporte.
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            marginTop: 20,
            padding: 16,
            border: '1px solid #334155',
            background: '#111827',
            color: '#cbd5e1',
          }}
        >
          {message}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 18,
            border: 0,
            borderRadius: 8,
            padding: '12px 16px',
            background: '#14b8a6',
            color: '#042f2e',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[CINESIA] Erro não tratado na árvore React:', error, info);
  }

  render() {
    if (this.state.error) {
      return <BootFailure error={this.state.error} />;
    }

    return this.props.children;
  }
}

async function bootstrap() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html.');
  }

  try {
    const [
      { default: App },
      { validateEnv },
      { registerSW },
      { checkForUpdate },
    ] = await Promise.all([
      import('./App'),
      import('./utils/validateEnv'),
      import('virtual:pwa-register'),
      import('./utils/checkForUpdate'),
      import('./utils/deviceLayout.js'),
    ]);

    validateEnv();

    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateSW(true);
        },
        onOfflineReady() {
          console.info('[PWA] Aplicação pronta para uso offline.');
        },
      });
    } catch (error) {
      console.warn('[PWA] Registro do service worker ignorado:', error);
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>,
    );

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(hideSplash);
    });

    window.setInterval(() => {
      checkForUpdate();
    }, 30000);
  } catch (error) {
    console.error('[CINESIA] Falha durante o bootstrap:', error);

    const root = ReactDOM.createRoot(rootElement);
    root.render(<BootFailure error={error} />);
    hideSplash();
  }
}

bootstrap();
