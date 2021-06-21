import { Store } from 'redux';

import { IState } from '../reducers';

export function getStyleOverrides(store: Store<IState>): string | null {
  let rules = '';
  const { hideAccolades, markLabyrinthChests } = store.getState().options;

  if (hideAccolades) {
    /* Base game's CSS for supporter list (roaming warrior list):
    .scene-select-supporter .s-base-container-long {
      height: 132px;
    }
    .is-modern-design .scene-select-supporter .s-base-container-long {
      background-image: url('/dff/static/ww/compile/en/img//common/bg/bg_marble_container_long.png?110a63c91');
      background-repeat: repeat-y;
      -webkit-background-size: 309px 90px;
      background-size: 309px 90px;
      width: 309px;
    }
    .scene-select-supporter .s-base-container-long:after {
      position: absolute;
      bottom: 0;
    }
    .scene-select-supporter .s-base-container-long.is-active:after {
      background-position: 0 -591px;
      width: 310px;
      height: 132px;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 5;
    }
    */
    rules += `
    .scene-select-supporter .c-base-container.s-base-container-long {
      height: 75px !important;
    }
    .scene-select-supporter .s-base-container-long.is-active:after {
      background-position: 0 -330px !important;
      height: 75px !important;
    }

    .scene-select-supporter .c-accolades {
      display: none !important;
    }
    `;
  }

  if (markLabyrinthChests) {
    rules += `
    div.s-treasure-box[data-app-treasure-chest-id="500101"],
    div.s-treasure-box[data-app-treasure-chest-id="500102"],
    div.s-treasure-box[data-app-treasure-chest-id="500103"],
    div.s-treasure-box[data-app-treasure-chest-id="500104"] {
      filter: brightness(2) contrast(1.5);
    }
    div.s-treasure-box[data-app-treasure-chest-id="400001"] {
    }
    div.s-treasure-box[data-app-treasure-chest-id="100001"],
    div.s-treasure-box[data-app-treasure-chest-id="200001"],
    div.s-treasure-box[data-app-treasure-chest-id="300001"] {
      filter: grayscale(1);
    }
    `;
  }

  return rules || null;
}
