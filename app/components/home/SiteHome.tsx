import * as React from 'react';
import { Link } from 'react-router-dom';

import {
  downloadUrl,
  ffrkCommunityUrl,
  gameUrl,
  misterPUrl,
  redditUrl,
} from '../../data/resources';
import { SiteExternalLink } from '../common/SiteExternalLink';
import { AppFeatures } from './AppFeatures';

export class SiteHome extends React.PureComponent {
  render() {
    return (
      <div>
        <p>
          RK Squared is a record keeper for{' '}
          <SiteExternalLink href={gameUrl}>Final Fantasy Record Keeper (FFRK)</SiteExternalLink>.
          It's available both as a web site and as an application for the Mac and PC.
        </p>

        <h3>The site</h3>
        <p>
          Information about the game, gathered and presented with help from the{' '}
          <SiteExternalLink href={ffrkCommunityUrl}>FFRK Community Database</SiteExternalLink>,{' '}
          <SiteExternalLink href={misterPUrl}>MisterP's PDF</SiteExternalLink>, and{' '}
          <SiteExternalLink href={redditUrl}>Reddit</SiteExternalLink>.
        </p>

        <h3>The application</h3>
        <p>
          The same information as the site, plus features to automatically track and manage your
          game progress:
        </p>
        <AppFeatures />
        <a href={downloadUrl} className="btn btn-primary" target="_blank" rel="noopener">
          Download Now
        </a>
        <Link to={'/appMoreInfo'} className="btn btn-default">
          More Info
        </Link>
      </div>
    );
  }
}
