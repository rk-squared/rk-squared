import * as React from 'react';

declare const window: Window & {
  adsbygoogle: Array<{}>;
};

export class GoogleAd250x250 extends React.Component {
  componentDidMount() {
    // Native HTML + JS version:
    /*
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    */
    // React version based on https://github.com/hustcc/react-adsense
    if (window) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // tslint:disable-next-line: no-console
        console.log(e);
      }
    }
  }

  render() {
    return (
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '250px', height: '250px' }}
        data-ad-client="ca-pub-6658071778960718"
        data-ad-slot="1366338554"
      />
    );
  }
}
