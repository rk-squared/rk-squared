import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { RelicDrawProbabilities } from '../actions/relicDraws';
import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import RelicChances from '../components/relicDraws/RelicChances';
import { RelicDrawBannerContents } from '../components/relicDraws/RelicDrawBannerContents';
import { RelicDrawModalLink } from '../components/relicDraws/RelicDrawModalLink';
import { IState } from '../reducers';
import {
  getBannerDetails,
  getVisibleExchangeShopSelections,
  RelicDrawBannerDetails,
} from '../selectors/relicDraws';

const styles = require('./RelicDrawBannerPage.scss');

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
  visibleExchangeShopSelections: Set<number>;
}

export class RelicDrawBannerPage extends React.PureComponent<
  Props & RouteComponentProps<RouteParams>
> {
  render() {
    const {
      banners,
      probabilities,
      isAnonymous,
      match,
      backLink,
      visibleExchangeShopSelections,
    } = this.props;
    const bannerId = +match.params.banner;
    const banner = banners[bannerId];
    const probability = probabilities[bannerId];
    if (!banner) {
      return <BadRelicDrawMessage />;
    }
    return (
      <>
        <img className="mw-100" src={banner.imageUrl} />
        <div className={styles.links}>
          <span className="d-inline-block w-50">
            <Link to={backLink}>Back to list of banners</Link>
          </span>
          {probability && (
            <span className="d-inline-block w-50 text-right">
              <RelicDrawModalLink bannerId={bannerId}>Relic draw simulator</RelicDrawModalLink>
            </span>
          )}
        </div>
        <RelicDrawBannerContents
          banner={banner}
          visibleExchangeShopSelections={visibleExchangeShopSelections}
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
  visibleExchangeShopSelections: getVisibleExchangeShopSelections(state),
}))(RelicDrawBannerPage);
