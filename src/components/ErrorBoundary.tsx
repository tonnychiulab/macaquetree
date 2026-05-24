import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div className="glass-panel" style={styles.panel}>
            <Terminal size={32} color="var(--color-critical)" style={styles.icon} />
            <h2 style={styles.title}>渲染發生錯誤</h2>
            <p style={styles.message}>
              顯示元件時發生非預期的錯誤：{this.state.error?.message}
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }} 
              className="glow-btn"
              style={styles.button}
            >
              <RefreshCw size={16} />
              重新載入頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  panel: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    maxWidth: '500px',
    textAlign: 'center' as const
  },
  icon: {
    marginBottom: '10px'
  },
  title: {
    color: 'var(--color-critical)',
    margin: 0
  },
  message: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  button: {
    marginTop: '10px'
  }
};
