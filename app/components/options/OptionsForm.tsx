import * as React from 'react';
import { connect } from 'react-redux';

import * as classNames from 'classnames';

import { Options, setOption as setOptionAction } from '../../actions/options';
import { ffrkCommunityHelp, ffrkCommunityUrl, misterPHelp, misterPUrl } from '../../data/resources';
import { IState } from '../../reducers';
import { KeysOfType } from '../../utils/typeUtils';
import { BrowserLink } from '../common/BrowserLink';
import { OptionsInput } from './OptionsInput';

const styles = require('./OptionsForm.scss');

interface Props {
  options: Options;
  capturePath?: string;
  logFilename?: string;
  setOption: (newOptions: Options) => any;
}

const Checkbox = ({
  id,
  children,
  options,
  setOption,
}: {
  id: KeysOfType<Required<Options>, boolean>;
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
      checked={options[id]}
      onChange={() => setOption({ [id]: !options[id] })}
    />
    <label className="form-check-label" htmlFor={id}>
      {children}
    </label>
  </div>
);

const HelpText = ({ children, className }: { children: any; className?: string }) => (
  <small className={classNames('form-text text-muted', className)}>{children}</small>
);

export class OptionsForm extends React.Component<Props> {
  render() {
    const { options, capturePath, logFilename, setOption } = this.props;
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

        <h5>RK&sup2; Preferences</h5>
        <p>Preferences affecting RK&sup2;'s own operations.</p>

        <div className="form-group row">
          <OptionsInput
            id="maxOldRelicDrawBannerAgeInDays"
            options={options}
            labelCols={3}
            inputCols={2}
            appendText="days"
            type="number"
            min={0}
            setOption={setOption}
          >
            Keep expired banners
          </OptionsInput>
          <HelpText className="col-sm-12">
            <p>
              Optionally keep banners for a while after they've closed, so you can review the last
              few days of a fest, or save up history for JP to use as foresight for GL.
            </p>
          </HelpText>
        </div>

        <h5>Troubleshooting</h5>
        <p>
          These options can be useful for testing and troubleshooting but are otherwise not needed.
        </p>

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
              .
            </p>
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="enableLogging" {...{ options, setOption }}>
            Enable logging
          </Checkbox>
          <HelpText>
            <p>
              Log RK&sup2; troubleshooting details and web traffic summaries
              {logFilename && (
                <span>
                  {' '}
                  to <code>{logFilename}</code>
                </span>
              )}
              . Changing this setting will not take effect until you restart RK&sup2; .{' '}
              <strong>Privacy note:</strong> These troubleshooting details include the URLs (but not
              contents) of web sites that your mobile device visits.
            </p>
          </HelpText>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ options, proxy }: IState) => ({
    options,
    capturePath: proxy.capturePath,
    logFilename: proxy.logFilename,
  }),
  dispatch => ({
    setOption: (newOptions: Options) => dispatch(setOptionAction(newOptions)),
  }),
)(OptionsForm);
