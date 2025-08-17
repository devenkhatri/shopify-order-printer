'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Banner, Button, Card, Layout, Page, BlockStack, InlineStack, Text } from '@shopify/polaris';
import { monitor } from '../monitoring/production';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Global error boundary for the Shopify Order Printer app
 * Catches JavaScript errors anywhere in the child component tree
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    monitor.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AppErrorBoundary',
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI using Polaris components
      return (
        <Page title="Something went wrong">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Banner
                    title="Application Error"
                    tone="critical"
                    onDismiss={undefined}
                  >
                    <Text as="p">
                      We're sorry, but something went wrong. Our team has been notified
                      and is working to fix the issue.
                    </Text>
                  </Banner>

                  <InlineStack gap="200">
                    <Button onClick={this.handleRetry}>Try Again</Button>
                    <Button onClick={this.handleReload} variant="secondary">
                      Reload Page
                    </Button>
                  </InlineStack>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingMd">
                          Error Details (Development Only)
                        </Text>
                        <Text as="p" tone="critical">
                          {this.state.error.message}
                        </Text>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {this.state.error.stack}
                        </pre>
                        {this.state.errorInfo && (
                          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                            {this.state.errorInfo.componentStack}
                          </pre>
                        )}
                      </BlockStack>
                    </Card>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: Record<string, any>) => {
    monitor.logError(error, {
      ...context,
      source: 'useErrorHandler',
      timestamp: new Date().toISOString(),
    });

    // You could also show a toast notification here
    console.error('Handled error:', error);
  };

  return handleError;
}

/**
 * Higher-order component for wrapping components with error handling
 */
export function withErrorHandling<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WithErrorHandlingComponent = (props: P) => {
    return (
      <AppErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </AppErrorBoundary>
    );
  };

  WithErrorHandlingComponent.displayName = `withErrorHandling(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithErrorHandlingComponent;
}

/**
 * Utility function for handling API errors consistently
 */
export function handleApiError(error: any, context?: Record<string, any>) {
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;

  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    errorMessage = error.response.data?.message || error.response.statusText;
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'Network error - please check your connection';
    statusCode = 0;
  } else if (error.message) {
    // Something else happened
    errorMessage = error.message;
  }

  const errorDetails = {
    message: errorMessage,
    statusCode,
    url: error.config?.url,
    method: error.config?.method,
    ...context,
  };

  monitor.logError(new Error(errorMessage), errorDetails);

  return {
    message: errorMessage,
    statusCode,
    isNetworkError: statusCode === 0,
    isServerError: statusCode >= 500,
    isClientError: statusCode >= 400 && statusCode < 500,
  };
}

/**
 * Component for displaying user-friendly error messages
 */
interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  action?: {
    label: string;
    onAction: () => void;
  };
  onDismiss?: () => void;
}

export function ErrorDisplay({ 
  error, 
  title = "Error", 
  action, 
  onDismiss 
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Banner
      title={title}
      tone="critical"
      action={action}
      onDismiss={onDismiss}
    >
      <Text as="p">{errorMessage}</Text>
    </Banner>
  );
}

/**
 * Component for displaying loading states with error fallback
 */
interface AsyncComponentProps {
  loading: boolean;
  error?: Error | string;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

export function AsyncComponent({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
}: AsyncComponentProps) {
  if (loading) {
    return loadingComponent || <div>Loading...</div>;
  }

  if (error) {
    return errorComponent || <ErrorDisplay error={error} />;
  }

  return <>{children}</>;
}