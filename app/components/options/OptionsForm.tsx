import * as React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as classNames from 'classnames';
import { remote } from 'electron';

import { showDanger } from '../../actions/messages';
import { Options, setOption as setOptionAction } from '../../actions/options';
import { deleteCertificate } from '../../proxy/tls';
import { IState } from '../../reducers';
import { KeysOfType } from '../../utils/typeUtils';
import { CheatWarningModalLink } from './CheatWarningModalLink';
import { OptionsInput } from './OptionsInput';

const styles = require('./OptionsForm.module.scss');

interface Props {
  options: Options;
  capturePath?: string;
  logFilename?: string;
  setOption: (newOptions: Options) => any;
  deleteCertificate: () => void;
}

interface State {
  recreatedCertificate: boolean;
}

const Checkbox = ({
  id,
  children,
  options,
  setOption,
  needsAppRestart,
  needsGameRestart,
}: {
  id: KeysOfType<Required<Options>, boolean>;
  children: any;
  options: Options;
  setOption: (o: Options) => void;
  needsAppRestart?: boolean;
  needsGameRestart?: boolean;
}) => {
  // Track whether a setting has changed, so we know if we need to prompt the
  // user to restart.  This is imperfect; to do it properly, we'd track state
  // at program start, not state at component mount.  But it's simple.
  const [state] = React.useState(options[id]);

  const showRestart = (needsAppRestart || needsGameRestart) && state !== options[id];
  return (
    <div className="form-check">
      <input
        className="form-check-input"
        id={id}
        name={id}
        type="checkbox"
        checked={!!options[id]}
        onChange={() => setOption({ [id]: !options[id] })}
      />
      <label className="form-check-label" htmlFor={id}>
        {children}
        {showRestart && (
          <span
            className={classNames('pl-2', {
              ['text-info']: needsAppRestart,
              ['text-success']: needsGameRestart,
            })}
          >
            <FontAwesomeIcon icon="exclamation-triangle" />
            {needsAppRestart && 'You must restart RK² for this to take effect.'}
            {needsGameRestart && 'This take effect after you restart FFRK.'}
          </span>
        )}
      </label>
    </div>
  );
};

const HelpText = ({ children, className }: { children: any; className?: string }) => (
  <small className={classNames('form-text text-muted', className)}>{children}</small>
);

export class OptionsForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      recreatedCertificate: false,
    };
  }

  handleRecreateCertificate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (
      !confirm(
        "After doing this, you'll have to restart RK² and reinstall your certificate on your iOS device. Continue?",
      )
    ) {
      return;
    }
    this.props.deleteCertificate();
    this.setState({ recreatedCertificate: true });
  };

  render() {
    const { options, capturePath, logFilename, setOption } = this.props;
    const { recreatedCertificate } = this.state;
    return (
      <div className={styles.component}>
        <div className="form-group">
          <Checkbox id="hideAccolades" {...{ options, setOption }} needsGameRestart={true}>
            Hide accolades
          </Checkbox>
          <HelpText>
            <p>Hide accolades from the roaming warrior (RW) list to save screen space.</p>
            <p>
              <CheatWarningModalLink>
                This is a cosmetic option and should be safe.
              </CheatWarningModalLink>
            </p>
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="markLabyrinthChests" {...{ options, setOption }} needsGameRestart={true}>
            Mark labyrinth chests
          </Checkbox>
          <HelpText>
            <p>
              Mark valuable labyrinth chests in-game, so that you don't have to check RK<sup>2</sup>{' '}
              for treasure chest details. 5★ chests (which contain Hero Artifacts) will be
              highlighted, 4★ chests (which may contain rare items such as anima lenses) will have
              their default blue appearance, and 1★ through 3★ chests will be grayed out.
            </p>
            <p>
              <CheatWarningModalLink>
                This is a cosmetic option and should be safe.
              </CheatWarningModalLink>
            </p>
          </HelpText>
        </div>

        <h5>RK&sup2; Preferences</h5>
        <p>Preferences affecting RK&sup2;'s own operations.</p>

        <div className="form-group row">
          <OptionsInput
            id="maxOldRelicDrawBannerAgeInDays"
            options={options}
            labelCols={3}
            inputCols={3}
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
              few days of a fest, or you could save up history for JP to use as foresight for GL.
            </p>
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="enableTransparentProxy" {...{ options, setOption }} needsAppRestart={true}>
            Enable transparent proxy
          </Checkbox>
          <HelpText>
            <p>
              Runs RK&sup2; as a transparent proxy on TCP port 80, along with its its normal port.
              In conjunction with an appropriate network setup, this allows using RK&sup2; with
              BlueStacks.
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
          <Checkbox id="enableLogging" {...{ options, setOption }} needsAppRestart={true}>
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
              . <strong>Privacy note:</strong> These troubleshooting details include the URLs (but
              not contents) of web sites that your mobile device visits.
            </p>
          </HelpText>
        </div>

        <div className="form-group">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={recreatedCertificate}
            onClick={this.handleRecreateCertificate}
          >
            Recreate Certificate
          </button>
          <HelpText className="col-sm-12">
            {!recreatedCertificate && (
              <p>
                If your iOS device is having problems connecting to FFRK, you can try recreating
                your certificate. You'll have to restart RK&sup2; and reinstall the certificate to
                your iOS device after doing this.
              </p>
            )}
            {recreatedCertificate && (
              <p>Please restart RK&sup2; to finish creating and loading the new certificate.</p>
            )}
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
  (dispatch) => ({
    setOption: (newOptions: Options) => dispatch(setOptionAction(newOptions)),
    deleteCertificate: () =>
      deleteCertificate(remote.app.getPath('userData'), (error: string) =>
        dispatch(showDanger(error)),
      ),
  }),
)(OptionsForm);
