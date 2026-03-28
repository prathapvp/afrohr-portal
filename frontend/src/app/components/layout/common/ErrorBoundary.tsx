import React, { Component, ReactNode } from 'react';
import { Container, Group, Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * ErrorBoundary component to catch and handle React rendering errors
 * Prevents white-screen crashes and provides user-friendly error UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentStack = errorInfo.componentStack || '';
    const errorMessage = `
      Error: ${error.toString()}
      Component Stack: ${componentStack}
      Time: ${new Date().toISOString()}
    `;

    console.error('ErrorBoundary caught an error:', errorMessage);

    this.setState({
      error,
      errorInfo: componentStack,
    });

    if (this.props.onError) {
      this.props.onError(error, componentStack);
    }

    this.logErrorToService(error, componentStack);
  }

  private logErrorToService = (error: Error, componentStack: string) => {
    try {
      const errorData = {
        message: error.toString(),
        stack: error.stack,
        componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Example: Send to error logging API
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData),
      // }).catch(err => console.error('Failed to log error:', err));

      console.warn('Error logged:', errorData);
    } catch (err) {
      console.error('Failed to log error to service:', err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Container size="md" py="xl">
            <Stack align="center" gap="lg">
              <ThemeIcon size="xl" radius="md" color="red" variant="light">
                <IconAlertCircle size={32} />
              </ThemeIcon>

              <Stack align="center" gap="xs">
                <Title order={2}>Oops! Something went wrong</Title>
                <Text color="dimmed" ta="center" size="sm">
                  We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                </Text>
              </Stack>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Stack gap="xs" style={{ width: '100%', maxWidth: '500px' }}>
                  <details style={{ marginTop: '20px', cursor: 'pointer' }}>
                    <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      Error Details (Development Only)
                    </summary>
                    <div
                      style={{
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        marginTop: '10px',
                      }}
                    >
                      <div>
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      {this.state.errorInfo && (
                        <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                          <strong>Component Stack:</strong>
                          <div>{this.state.errorInfo}</div>
                        </div>
                      )}
                    </div>
                  </details>
                </Stack>
              )}

              <Group>
                <Button onClick={this.handleReset} variant="light">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="filled">
                  Refresh Page
                </Button>
              </Group>
            </Stack>
          </Container>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
