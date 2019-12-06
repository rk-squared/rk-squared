import * as React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { BrowserLink } from '../common/BrowserLink';
import { ModalDialog } from '../common/ModalDialog';

interface Props {
  children: any;
  className?: string;
}

interface State {
  isOpen: boolean;
}

const Title = () => (
  <span>
    <FontAwesomeIcon icon="exclamation-triangle" className="text-danger" /> Modifying FFRK Game
    Behavior
  </span>
);

export class CheatWarningModalLink extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { children, className } = this.props;
    const { isOpen } = this.state;
    return (
      <>
        <a href="#" className={className} onClick={this.handleOpen}>
          {children}
        </a>
        {isOpen && (
          <ModalDialog
            isOpen={this.state.isOpen}
            onClose={this.handleClose}
            className="modal-lg app-modal-full-height"
            title={Title}
          >
            <p>
              There have been reports of player accounts being flagged for cheating and, as a
              result, not receiving awards for defeating Dark Odin. In some cases, players have
              confessed to using cheat tools to modify battle data, making the battles trivial to
              win; in other cases, it's not clear why accounts were flagged. See{' '}
              <BrowserLink href="https://www.reddit.com/r/FFRecordKeeper/comments/dx0tkt/dark_odin_rewards_not_being_received/">
                Reddit discussions
              </BrowserLink>{' '}
              for further details.
            </p>
            <p>
              To the best of our knowledge, RK&sup2; is not considered a cheat tool and has not
              resulted in an account being flagged. In its default mode, RK&sup2; acts as a passive
              HTTP proxy; as such, it should be basically undetectable, and since HTTP proxies are a
              standardized, decades-old Internet technology, it should be completely
              unobjectionable.
            </p>
            <p>
              Any of RK&sup2;'s options that modify the behavior of FFRK itself should be used at
              your own risk. This is especially true for the &ldquo;Always show timer&rdquo; option,
              which modifies battle data. Cosmetic options are believed to be safe and are regularly
              used by RK&sup2;'s developer with no ill effects.
            </p>
          </ModalDialog>
        )}
      </>
    );
  }
}
