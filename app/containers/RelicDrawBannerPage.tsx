import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { RelicDrawProbabilities } from '../actions/relicDraws';
import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import RelicChances from '../components/relicDraws/RelicChances';
import { RelicDrawBannerContents } from '../components/relicDraws/RelicDrawBannerContents';
import { RelicDrawModal } from '../components/relicDraws/RelicDrawModal';
import { IState } from '../reducers';
import { getBannerDetails, RelicDrawBannerDetails } from '../selectors/relicDraws';

interface RouteParams {
  banner: string;
}

interface Props {
  banners: {
    [bannerId: number]: RelicDrawBannerDetails;
  };
  probabilities: {
    [bannerId: string]: RelicDrawProbabilities;
  };
  isAnonymous?: boolean;
  backLink: string;
}

export class RelicDrawBannerPage extends React.PureComponent<
  Props & RouteComponentProps<RouteParams>
> {
  render() {
    const { banners, probabilities, isAnonymous, match, backLink } = this.props;
    const bannerId = +match.params.banner;
    const banner = banners[bannerId];
    const probability = probabilities[bannerId];
    if (!banner) {
      return <BadRelicDrawMessage />;
    }
    // FIXME: Duplication/overlap with RelicDrawGroupPage
    // FIXME: Proper RelicDrawModal links
    // FIXME: Hide RelicDrawModel if probabilities are missing
    return (
      <>
        <img src={banner.imageUrl} />
        <p>
          <Link to={backLink}>back to list of banners</Link>
        </p>
        <RelicDrawModal bannerId={bannerId} />
        <RelicDrawBannerContents
          banner={banner}
          probabilities={probability}
          isAnonymous={isAnonymous}
        />
        {probability && (
          <RelicChances
            banner={banner}
            probabilities={probability}
            isAnonymous={isAnonymous}
            className="sticky-bottom"
          />
        )}
      </>
    );
  }
}

export default connect((state: IState) => ({
  banners: getBannerDetails(state),
  probabilities: state.relicDraws.probabilities,
}))(RelicDrawBannerPage);
