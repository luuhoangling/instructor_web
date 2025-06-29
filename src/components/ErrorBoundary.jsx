import React from 'react';
import { Result, Button } from 'antd';

/**
 * ErrorBoundary component
 * Bắt và xử lý lỗi JavaScript trong React component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state để render error UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log lỗi cho debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // TODO: Send error to monitoring service (Sentry, LogRocket, etc.)
    // this.logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Reset error state và reload page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset error state và redirect về home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '20px'
        }}>
          <Result
            status="500"
            title="Oops! Có lỗi xảy ra"
            subTitle="Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                Tải lại trang
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                Về trang chủ
              </Button>
            ]}
          >
            {/* Development mode: Show error details */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                textAlign: 'left', 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '8px',
                marginTop: '24px',
                maxWidth: '800px'
              }}>
                <h4>Chi tiết lỗi (Development mode):</h4>
                <pre style={{ 
                  fontSize: '12px', 
                  color: '#d32f2f',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
