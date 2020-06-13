# RK Squared

_A Record Keeper for Final Fantasy Record Keeper_

Current features:

- Dungeon tracker - track dungeon completion status and unclaimed reward
- Drop tracker - show what you'll get when you finish the current battle
- Record Materia tracker - to help you see which RMs you have unlocked but not yet acquired, what you have to to do get the best RMs, and which RMs are cluttering up your inventory and should be stashed
- Score tracker - view all your torment progress and magicite completion times on a single page to help you see where to focus next
- Game options
  - Always show timer

RK Squared runs as a proxy: It runs on your PC and Mac, and you configure your phone, tablet, or emulator to connect through it, so that it can track your game status.

Both Android and iOS versions of FFRK are supported.

Both the global and Japanese versions of FFRK are supported. However, a running copy of RK Squared only supports a single FFRK profile, so trying to use one copy to track both GL and JP will cause confusion.

## Development

RK Squared uses TypeScript, React, and Electron.

As of June 2020, a license to Font Awesome Pro is also required.

Sample instructions for setting up development:

```sh
# Install packages (assuming you have Yarn installed).
yarn

# Download the latest data from the FFRK Community Database (originally
# Enlir).
yarn get-enlir

# Run PEG.js to generate the parsers for the FFRK Community Database data.
yarn peg

# Run the following four commands in different terminal windows:

# 1. Start the TypeScript compiler to automatically compile the back-end.
yarn build:watch

# 2. Start the test suite. Note: Some tests (esp. around parsing soul breaks)
#    may be broken.
yarn test:watch

# 3. Start the renderer job. This builds and serves the React components for
#    the front-end.
yarn start-renderer-dev

# 4. Start the main job. This runs the proxy and launches the Electron
#    front-end, using React components served by the renderer job.
yarn start-main-dev

# Build an installable release.
yarn package:all
```

## JP support

Notes on playing the JP version and using RK Squared with it:

https://www.reddit.com/r/FFRecordKeeper/comments/baxn2x/a_step_by_step_guide_to_playing_final_fantasy/

https://www.reddit.com/r/FFRecordKeeper/wiki/index/jp_version_info

https://www.reddit.com/r/FFRecordKeeper/comments/bkykc7/rk_squared_on_bluestacks/

## Troubleshooting

For PC:

1. Click the Start menu.
2. Type "cmd", without the quotes, and press Enter.
3. Type the following command, then press Enter: `"%LocalAppData%\Programs\rk-squared\RK Squared.exe"`
4. Retry whatever operation was resulting in the error.
5. Copy the log contents from your terminal window, and paste them into a private message to me.

For Mac:

1. Press Command-Space to bring up Spotlight Search.
2. Type "terminal", and click on the Terminal application.
3. Paste the following command into your terminal window and press Enter: `/Applications/RK\ Squared.app/Contents/MacOS/RK\ Squared`
4. Retry whatever operation was resulting in the error.
5. Copy the log contents from your terminal window, then paste it into a private message to me.

## Other Resources

- [Shaker's FFRK Toolkit](https://www.reddit.com/r/FFRecordKeeper/comments/90m8f1/shakers_ffrk_toolkit_v30public_beta/)
- [FFRK Search Engine](https://www.reddit.com/r/FFRecordKeeper/comments/91cx81/work_in_progress_ffrk_search_engine/) (see also [here](https://www.reddit.com/r/FFRecordKeeper/comments/92zzuf/work_in_progress_ffrk_search_engine_weekly_update/))
- [FFRK Lookup Chrome extension](https://www.reddit.com/r/FFRecordKeeper/comments/91s7nm/ffrk_lookup_chrome_extension_in_beta/)
- [FFRK Drop Tracker + spreadsheets](https://www.reddit.com/r/FFRecordKeeper/comments/82y4ik/ffrk_drop_tracker_and_inventory_exporter_export/)
- [FFRKreeper](https://ffrkreeper.com/), and [how to use it with macOS](https://www.reddit.com/r/FFRecordKeeper/comments/7bxi5m/setting_up_ffrkreeper_in_mac_with_burp/)
- [SoulBreak Search](https://www.reddit.com/r/FFRecordKeeper/comments/94twzj/soulbreak_search_version_151_release_now_with/)
- [DJVDT's FFRK Go-To](https://www.reddit.com/r/FFRecordKeeper/comments/9koigt/djvdts_ffrk_goto_a_few_new_things/)
- [EnemyAbilityParser](https://pastebin.com/xHU5FCqA)
- [JSON spreadsheet](https://docs.google.com/spreadsheets/d/1NrrlNJKeStKD4qmD-liAPg5Ow6wzMGWpBTa2ycMPYNs/edit#gid=1580077494)

Data mining:

- [Buffs and debuffs](https://www.reddit.com/r/FFRecordKeeper/comments/aa5ctk/psa_buffdebuff_duration_lms_do_not_extend_crit/)

## Viewing Logs

In macOS:

1. Press Command-Space to bring up Spotlight Search.
2. Type "terminal", without the quotes, and click on the Terminal application.
3. Paste the following command into your terminal window and press Enter:
   ```
   /Applications/RK\ Squared.app/Contents/MacOS/RK\ Squared
   ```
4. Retry whatever operation was resulting in the error.
5. Copy the log contents from your terminal window.

In Windows:

1. Click the Start menu.
2. Type "cmd", without the quotes, and press Enter.
3. Paste the following command (_including_ quotes), then press Enter:
   ```
   "%LocalAppData%\Programs\rk-squared\RK Squared.exe"
   ```
4. Retry whatever operation was resulting in the error.
5. Copy the log contents from your command prompt window.
