import * as React from 'react';
import { connect } from 'react-redux';

import { Options, setOption } from '../actions/options';
import { IState } from '../reducers';

// const styles = require('./Options.scss');

// FIXME: Best approach?
// tslint:disable no-shadowed-variable

// FIXME: Styling

interface Props {
  options: Options;
  setOption: (newOptions: Options) => any;
}

const Checkbox = (
  { id, children, options, setOption }:
    { id: string, children: any, options: Options, setOption: (o: Options) => void }
) => (
    <label>
      <input
        id={id} name={id} type="checkbox"
        checked={(options as any)[id]}
        onChange={() => setOption({[id]: !(options as any)[id]})}
      />
      {children}
    </label>
);

export class OptionsComponent extends React.Component<Props> {
  render() {
    const { options, setOption } = this.props;
    return (
      <div>
        <Checkbox id="alwaysShowTimer" {...{options, setOption}}>
          Always show timer
        </Checkbox>
        <div className="form-text">
          Besides self-imposed speedrun challenges, this can be useful for tracking
          when buffs and debuffs might expire.
        </div>

        <Checkbox id="staticBattleBackground" {...{options, setOption}}>
          Show static battle backgrounds
        </Checkbox>
        <div className="form-text">
          Replaces all battle backgrounds with the Nightmare's plain, dark caverns.
          This may help performance on older phones or tablets.
        </div>

        <Checkbox id="hideNewcomerBanners" {...{options, setOption}}>
          Hide Newcomers' Welcome Relic Draws
        </Checkbox>
        <div className="form-text">
          The relics on the Newcomers' Welcome banners are outdated and are much
          weaker than relics on current banners.  Most experienced players would
          recommend not pulling on them.  <strong>All</strong> experienced
          players would recommend not pulling on them at full price.
        </div>
      </div>
    );
  }
}

export default connect(
  ({ options }: IState) => ({ options }),
  dispatch => ({
    setOption: (newOptions: Options) => dispatch(setOption(newOptions))
  })
)(OptionsComponent);
