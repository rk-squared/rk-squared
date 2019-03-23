import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { RelicDrawBanner, RelicDrawProbabilities } from '../actions/relicDraws';
import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import { RelicDrawBannerDetails } from '../components/relicDraws/RelicDrawBannerDetails';
import { IState } from '../reducers';

interface RouteParams {
  banner: string;
}

interface Props {
  banners: {
    [bannerId: number]: RelicDrawBanner;
  };
  probabilities: {
    [bannerId: string]: RelicDrawProbabilities;
  };
  backLink: string;
}

export class RelicDrawBannerPage extends React.PureComponent<
  Props & RouteComponentProps<RouteParams>
> {
  render() {
    const { banners, probabilities, match, backLink } = this.props;
    const banner = banners[+match.params.banner];
    const probability = probabilities[+match.params.banner];
    if (!banner) {
      return <BadRelicDrawMessage />;
    }
    // FIXME: Duplication/overlap with RelicDrawGroupPage
    // FIXME: Correct back link
    return (
      <>
        <img src={banner.imageUrl} />
        <p>
          <Link to={backLink}>back to list of banners</Link>
        </p>
        <RelicDrawBannerDetails banner={banner} probabilities={probability} />
      </>
    );
  }
}

export default connect((state: IState) => ({
  banners: state.relicDraws.banners,
  probabilities: state.relicDraws.probabilities,
}))(RelicDrawBannerPage);
