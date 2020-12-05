import * as http from 'http';
import * as net from 'net';

import { isFfrkStartupRequest } from '../ffrk-proxy';

describe('dungeonScores proxy handler', () => {
  describe('isFfrkStartupRequest', () => {
    function makeRequest(accept = 'text/html') {
      const req = new http.IncomingMessage(new net.Socket());
      req.headers['accept'] = accept;
      return req;
    }

    const globalAndroidUrl = 'http://ffrk.denagames.com/dff/';
    const globalIosUrl = 'https://ffrk.denagames.com/dff/';
    // I assume that JP uses the same Android vs. iOS HTTP vs. HTTPS, but I
    // haven't run iOS JP to confirm.
    const jpAndroidUrl = 'http://dff.sp.mbga.jp/dff/';
    const jpIosUrl = 'https://dff.sp.mbga.jp/dff/';

    it('returns true for normal startup requests', () => {
      const req = makeRequest();

      for (const url of [globalAndroidUrl, globalIosUrl, jpAndroidUrl, jpIosUrl]) {
        req.url = url;
        expect(isFfrkStartupRequest(req)).toBe(true);
      }
    });

    it('returns true for reloading the page after a battle', () => {
      const req = makeRequest();
      req.url = 'http://ffrk.denagames.com/dff/?timestamp=1566384964';

      expect(isFfrkStartupRequest(req)).toBe(true);
    });

    it('returns false for game API requests', () => {
      const req = makeRequest('application/json');
      req.url = 'http://ffrk.denagames.com/dff/notification/get_data';

      expect(isFfrkStartupRequest(req)).toBe(false);
    });

    it('returns false for third-party sites', () => {
      const req = makeRequest();
      req.url = 'https://google.com/';

      expect(isFfrkStartupRequest(req)).toBe(false);
    });
  });
});
