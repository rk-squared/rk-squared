import * as React from 'react';

import { IconName } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as classnames from 'classnames';

import { binaryDownloadUrl, PlatformType } from '../../data/resources';

const { version } = require('../../../package.json');

const icon: { [platform in PlatformType]: IconName } = {
  mac: 'apple',
  windows: 'windows',
};
const description: { [platform in PlatformType]: string } = {
  mac: 'Mac',
  windows: 'Windows',
};

export const BinaryDownloadButton = ({
  platform,
  className,
}: {
  platform: PlatformType;
  className?: string;
}) => (
  <a
    href={binaryDownloadUrl(version, platform)}
    className={classnames('btn btn-primary', className)}
    target="_blank"
    rel="noopener noreferrer"
  >
    <FontAwesomeIcon icon={['fab', icon[platform]]} /> Download for {description[platform]}
  </a>
);
