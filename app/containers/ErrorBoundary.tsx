import * as React from 'react';

import { BrowserLink } from '../components/common/BrowserLink';

interface Props {
  className?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    // tslint:disable-next-line: no-console
    console.error(error);
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
    };
  }

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // FIXME: Log to an error reporting service
  }

  render() {
    // FIXME: Reset hasError on new route
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading">An error has occurred.</h4>
          <p>We apologize for the trouble.</p>
          <p>
            Please go to the{' '}
            <BrowserLink
              href="https://github.com/rk-squared/rk-squared/issues"
              className="alert-link"
            >
              RK² issues page
            </BrowserLink>{' '}
            and provide information about what you were doing.
          </p>
          {error && <p>Please include the following details:</p>}
          {error && (
            <pre>
              <code>
                {error.name}: {error.message}
                {error.stack}
              </code>
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
