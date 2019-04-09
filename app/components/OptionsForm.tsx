import * as React from 'react';
import { connect } from 'react-redux';

import { Options, setOption as setOptionAction } from '../actions/options';
import { ffrkCommunityHelp, ffrkCommunityUrl, misterPHelp, misterPUrl } from '../data/resources';
import { IState } from '../reducers';
import { BrowserLink } from './common/BrowserLink';

const styles = require('./OptionsForm.scss');

interface Props {
  options: Options;
  capturePath: string;
  setOption: (newOptions: Options) => any;
}

const Checkbox = ({
  id,
  children,
  options,
  setOption,
}: {
  id: string;
  children: any;
  options: Options;
  setOption: (o: Options) => void;
}) => (
  <div className="form-check">
    <input
      className="form-check-input"
      id={id}
      name={id}
      type="checkbox"
      checked={(options as any)[id]}
      onChange={() => setOption({ [id]: !(options as any)[id] })}
    />
    <label className="form-check-label" htmlFor={id}>
      {children}
    </label>
  </div>
);

const HelpText = ({ children }: { children: any }) => (
  <small className="form-text text-muted">{children}</small>
);

export class OptionsForm extends React.Component<Props> {
  render() {
    const { options, capturePath, setOption } = this.props;
    return (
      <div className={styles.component}>
        <div className="form-group">
          <Checkbox id="alwaysShowTimer" {...{ options, setOption }}>
            Always show timer
          </Checkbox>
          <HelpText>
            Besides self-imposed speedrun challenges, this can be useful for tracking when buffs and
            debuffs might expire. Check{' '}
            <BrowserLink href={ffrkCommunityUrl} title={ffrkCommunityHelp}>
              FFRK Community
            </BrowserLink>{' '}
            or{' '}
            <BrowserLink href={misterPUrl} title={misterPHelp}>
              MisterP
            </BrowserLink>{' '}
            for details on buff durations.
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="saveTrafficCaptures" {...{ options, setOption }}>
            Save captured game traffic
          </Checkbox>
          <HelpText>
            <p>
              Save captured FFRK network traffic
              {capturePath && (
                <span>
                  {' '}
                  under <code>{capturePath}</code>
                </span>
              )}
              . This can be helpful for testing and troubleshooting but is otherwise not needed.
            </p>
          </HelpText>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ options, proxy }: IState) => ({ options, capturePath: proxy.capturePath }),
  dispatch => ({
    setOption: (newOptions: Options) => dispatch(setOptionAction(newOptions)),
  }),
)(OptionsForm);
