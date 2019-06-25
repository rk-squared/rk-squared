import * as React from 'react';

import { defaultOptions, Options } from '../../actions/options';
import { KeysOfType } from '../../utils/typeUtils';

type TypeProps =
  | {
      id: KeysOfType<Required<Options>, number>;
      type: 'number';
    }
  | {
      id: KeysOfType<Required<Options>, string>;
      type: undefined;
    };

interface Props {
  options: Options;
  children: any;
  labelCols: number;
  inputCols: number;
  appendText?: string;
  setOption: (o: Options) => void;
}

export class OptionsInput extends React.Component<
  Props & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof { type: string }> & TypeProps
> {
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { setOption } = this.props;
    if (this.props.type === 'number') {
      setOption({ [this.props.id]: +e.target.value });
    } else {
      setOption({ [this.props.id]: e.target.value });
    }
  };

  render() {
    const {
      id,
      options,
      children,
      labelCols,
      inputCols,
      appendText,
      setOption,
      ...props
    } = this.props;
    return (
      <>
        <label htmlFor={id} className={`col-sm-${labelCols} col-form-label`}>
          {children}
        </label>
        <div className={`col-sm-${inputCols} input-group`}>
          <input
            {...props}
            className="form-control"
            id={id}
            min={0}
            value={options[id] == null ? defaultOptions[id] : options[id]}
            onChange={this.handleChange}
          />
          {appendText && (
            <div className="input-group-append">
              <div className="input-group-text">{appendText}</div>
            </div>
          )}
        </div>
      </>
    );
  }
}
