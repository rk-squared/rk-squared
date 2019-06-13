# v2.2.0

- Dungeons
  - Show anima lense rewards in record dungeons
- Relic Draws
  - Show mythril costs in banner summaries
  - Add anima lens information to relic draw selections
  - Correctly calculate probabilities for non-standard banners like Luck of the Realms

# v2.1.0

- New feature: Export
  - You can now export your soul break inventory and legend materia inventory in CSV format.
  - Exporting all of RK Squared's state as JSON is also supported.
- Dungeons
  - Add icons for Corridor of Trials, Power Up Dungeons, and Mote Dungeons
  - Properly handle new 10%-40% rewards for torment dungeons
  - Improve handling of Mote Dungeons
- Soul Breaks
  - Add the ability to filter: all soul breaks, GL only, or owned only
  - Fix: Properly track required soul break experience for all soul breaks.
  - Add shared soul breaks page
  - Improve display of hybrid soul breaks
  - Various fixes for individual soul breaks
- Record Materia
  - Attack replacement materia now include details about their replacement skills
  - Add Vayne, Trey, and Ultimecia; fix Dr. Mog RM3
- Relic Draws
  - Add probability analysis for banners, including the ability to see your chances of getting relics you're interested in. Probabilities are currently based on [proposal 5 of /u/Spiralis's analysis](https://www.reddit.com/r/FFRecordKeeper/comments/83l3jd/analysis_of_fuitads_gacha_data/); this may change in a future version.
  - Various improvements to formatting and display
- Options
  - Remove the static battle background option - It no longer works in current versions of FFRK. In practice, it was of little benefit; enemy special effects and soul break animations hurt performance worse.
  - Add an option to save the troubleshooting and network log, to aid in troubleshooting.

# v2.0.0

- New feature: Soul Breaks
  - List soul breaks and legend materia in a convenient two-column format, inspired by MrP's PDFs
  - Track owned soul breaks and legend materia
  - A reminder with details about any unmastered soul breaks and legend materia is automatically shown at the top.
- New feature: Relic Draws
  - Show currently opened relic draws, including selection options, percent chances, and soul break / legend materia details.
  - Dupes are shaded to help visualize your chances of a good draw.
- Dungeon Tracker
  - Dungeons with unclaimed prizes are no longer shown as completely finished
  - Better icons
- Record Materia Tracker
  - Fix some longstanding bugs with vaulted materia
- Significant internal changes to improve performance and download size and to support [rk-squared.com](https://www.rk-squared.com/)

# v1.1.0

- Add Dungeon Score Tracker - view all your torment progress and magicite completion times on a single page to help you see where to focus next
- Add JP support
- Display a pop-up notification if your IP address changes, to let you know that your proxy needs to be reconfigured
- Add tooltips giving details for Record Materia Tracker grid's effects
- Add new characters to the Record Materia Tracker
- Replace Enlir links with FFRK Community spreadsheet
- Performance improvements

# v1.0.0

Version 1.0.0 adds iOS support and includes several fixes:

- Dungeon Tracker
  - Proper support for Neo Torments
  - Update dungeon status on Dungeon Updates
  - Track Record Dungeon chests
  - Fix a bug with handling of new/unknown accessories
- Record Materia Tracker
  - Fix bugs with tracking which RMs have been obtained
  - Minor updates to layouts and contents
  - Fix a bug with Record Dungeons causing the RM tracker to get confused
- Options
  - Remove the "Hide Newcomer's Banner" option. FFRK implemented this itself.

# v0.20.0

Record materia tracker. Support for record dungeons and one-time reward grades. Improved error handling.

# v0.10.1

Improve error handling

# v0.10.0

Beta version - drop tracker, dungeon tracker, a few game options
