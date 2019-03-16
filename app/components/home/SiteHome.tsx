import * as React from 'react';
import { Link } from 'react-router-dom';

import {
  downloadUrl,
  ffrkCommunityUrl,
  gameUrl,
  misterPUrl,
  redditUrl,
} from '../../data/resources';
import { AppFeatures } from './AppFeatures';

export class SiteHome extends React.PureComponent {
  render() {
    return (
      <div>
        <p>
          RK Squared is a record keeper for <a href={gameUrl}>Final Fantasy Record Keeper (FFRK)</a>
          . It's available both as a web site and as an app for the Mac and PC.
        </p>

        <h3>The site</h3>
        <p>
          Information about the game, gathered and presented with help from the{' '}
          <a href={ffrkCommunityUrl} target="_blank">
            FFRK Community Database
          </a>
          ,{' '}
          <a href={misterPUrl} target="_blank">
            MisterP's PDF
          </a>
          , and{' '}
          <a href={redditUrl} target="_blank">
            Reddit
          </a>
          .
        </p>

        <h3>The app</h3>
        <p>
          The same information as the site, plus features to automatically track and manage your
          game progress:
        </p>
        <AppFeatures />
        <a href={downloadUrl} className="btn btn-primary" target="_blank">
          Download Now
        </a>
        <Link to={'/appMoreInfo'} className="btn btn-default">
          More Info
        </Link>
      </div>
    );
  }
}
