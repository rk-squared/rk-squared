# RK Squared

_A Record Keeper for Final Fantasy Record Keeper_

Based on [electron-react-typescript-boilerplate](https://github.com/iRath96/electron-react-typescript-boilerplate)

## To Do

1. Soul Break updates - Lightning SASB, etc.
2. Search hotkeys?
3. Add an explanation of probability calculator
4. Export to ffrktoolkit.com
5. Update Enlir data outside of releases
6. Check for updates
7. Support for multiple profiles
8. Extend probability analysis for G2 on JP
9. BlueStacks support? https://www.reddit.com/r/FFRecordKeeper/comments/bkykc7/rk_squared_on_bluestacks/
10. FFRK Toolkit Helper interop? (see Reddit messages)
11. Switch languages for JP
12. Show Dungeons expirations (see Reddit messages)
13. Soul break list - formatting, show random hits
14. Stateless components
15. Error reporting (Sentry?)
16. Rubies / ruby tracker

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
