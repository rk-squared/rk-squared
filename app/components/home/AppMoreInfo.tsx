import * as React from 'react';

import { AppFeatures } from './AppFeatures';

export const AppMoreInfo = () => (
  <>
    <p>Current features:</p>
    <AppFeatures />

    <p>
      RK Squared runs as a proxy: It runs on your PC and Mac, and you configure your phone, tablet,
      or emulator to connect through it, so that it can track your game status.
    </p>
    <p>Both Android and iOS versions of FFRK are supported.</p>
    <p>
      Both the global (GL) and Japanese (JP) versions of FFRK are supported. However, a running copy
      of RK² only supports a single FFRK profile, so trying to use one copy to track both GL and JP
      will cause confusion.
    </p>

    <h3>Security Note</h3>

    <p>
      FFRK for iOS encrypts its data, so, in order for RK² to work for iOS, it needs to be able to
      decrypt HTTPS traffic. As a general rule, you should be very cautious in granting software the
      ability to do this, and you should only do it with software you trust. (RK² is designed so
      that it can only decrypt FFRK traffic, which should help with any security concerns. In
      technical terms, it generates a private CA (certificate authority); then it uses that CA to
      create and save a certificate for ffrk.denagames.com, so that it can decrypt FFRK traffic;
      then it discards the CA key, so that it can't create certificates for any other sites.)
    </p>

    <h3>Known Issues</h3>

    <p>
      RK²'s information about soul breaks and legend materias is currently not automatically updated
      outside of new releases; it's just a snapshot of whatever was available at its last release.
    </p>

    <p>
      RK² currently only supports a single FFRK profile. So, for example, if you play both GL and
      JP, you'll need to find a way to run two copies of RK² (for example, use two different
      laptops, or two different PC accounts, or manually copy RK²'s config.json depending on which
      profile you're playing).
    </p>
  </>
);
