import * as React from 'react';

import { History } from 'history';

import { BrowserLink } from '../components/common/BrowserLink';
import { issuesUrl } from '../data/resources';

interface Props {
  className?: string;
  history?: History;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  unlisten?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // eslint-disable-next-line no-console
    console.error(error);
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    if (this.props.history) {
      // Assume any errors are local to the current route.  If we navigate to a
      // new route, then clear the route state.
      this.unlisten = this.props.history.listen(() => this.setState({ hasError: false }));
    }
  }

  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // FIXME: Log to an error reporting service
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading">An error has occurred.</h4>
          <p>We apologize for the trouble.</p>
          <p>
            Please go to the{' '}
            <BrowserLink href={issuesUrl} className="alert-link">
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
