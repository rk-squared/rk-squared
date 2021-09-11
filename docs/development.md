# Design and Development

RK² uses TypeScript, React, Redux, Electron, and Bootstrap.

It's designed so that it can be built as an Electron application for a desktop OS or as a traditional web site (hosted on GitHub Pages).

Folder structure:

- `app` - the application itself
- `configs`, `internals` - Webpack configurations
- `public` - static assets that are included directly in the web site / application
- `resources` - additional assets
- `scripts` - developer scripts
- `types` - TypeScript `.d.ts` files that we maintain for third-party code

Webpack configurations and overall application structure were originally based off of [iRath96/electron-react-typescript-boilerplate](https://github.com/iRath96/electron-react-typescript-boilerplate) (for the Electron side) and [Create React App](https://create-react-app.dev/) (ejected) (for the static web site side).

## Major components

### Proxy

RK² uses a transparent proxy to listen in on FFRK network requests and gather information about game state.

See [`app/proxy/ffrk-proxy.ts`](../app/proxy/ffrk-proxy.ts) as a starting point. Proxy logic is organized as handlers for individual FFRK network requests; handlers are organized by area of functionality (the modules under the `app/proxy` directory) and then by URL.

To facilitate this, RK² uses TypeScript type definitions that track, to the best of its knowledge, the API calls and responses that FFRK uses. These type definitions are kept under [`app/schemas`](../app/schemas) and were generated with help from [quicktype](https://quicktype.io/).

**Example**: Updating RK² in response to changes in FFRK's API:

1. Set up an RK² development environment, as described in the [README](../README.md), and launch a development copy of RK².
2. In RK², go under Options and turn on "Save captured game traffic."
3. In FFRK, do whatever operation(s) cause the updated API calls to occur.
4. In the terminal window that's running `yarn start-main-dev`, find the file(s) that were saved and open them.
5. Manually update the `app/schemas` files to match the new contents, or copy and paste the contents into [app.quicktype.io](https://app.quicktype.io/) and use the schemas that it generates to help update the `app/schemas` files.
6. Make any changes to handlers under `app/proxy`.

### Reducers and store

RK² uses Redux to track the FFRK game state that it gets from the proxy.

Actions to update the state are dispatched by the proxy code. Selectors (see [Reselect](https://github.com/reduxjs/reselect)) help process the game state into something that the application can easily display to end users.

The code that handles this is in the `app/actions`, `app/reducers`, and `app/selectors` directories. All of this follows a fairly standard Redux design.

### UI

It's the job of RK²'s UI to present the FFRK game state that's tracked by Redux, combined with data from the FFRK Community Database.

RK² intended to follow the older [presentational and container components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) style for a React application, but it does so only loosely. In practice:

- Top-level components that merely connect together lower-level logic are under `app/containers`.
- Lower-level pieces of UI are organized by area of functionality under `app/components`.

### FFRK Community Database

RK² depends heavily on information from the [FFRK Community Database](https://www.reddit.com/r/FFRecordKeeper/comments/a269hy/ffrk_community_database_enlirs_continued/), and, before that, Enlir's database. (The source code still refers to all of this as `enlir` internally.)

See:

- [app/data/enlir.ts](../app/data/enlir.ts) - type definitions and helper functions
- [app/data/enlir](../app/data/enlir) - JSON data exported from the FFRK Community Database
- [scripts/download-enlir.ts](../scripts/download-enlir.ts) - the script for re-exporting JSON data from the FFRK Community Database

**Example**: Updating the exported JSON data:

- Run `yarn get-enlir`, as described in the [README](../README.md).
- This requires a set of Google credentials; the `yarn get-enlir` command should provide guidance on how to help create those. If you have problems, you can try deleting `credentials.json` and trying again.
- Note that changes to the FFRK Community Database may necessitate updates to RK²'s code in order to correctly handle the updated data. Any parser issues (see below) can generally be put off, but changes to column layout, etc. may need immediate attention.
- If you want, you can use the `review-mrp-...` scripts (described below) to help check how well the parser can handle any database changes.

There's also a `scripts/update-enlir.ts` that helps automate making certain common updates to the FFRK Community Database (e.g., marking relics as released in GL). As with any automation of this sort, exercise caution in running it to make sure that it doesn't make unintended changes.

### The MrP parser

RK² takes the data from the FFRK Community Database and parses it to resolve references between soul breaks, statuses, and other effects, and to distill down all of that information into a more compact and consolidated format.

This approach was heavily inspired by [MisterP's PDF compilation](http://happypluto.com/~misterp/r/ffrk.pdf) for FFRK, so this section of code is named mrP. Its core is a [PEG.js](https://pegjs.org/) parser for FFRK Community Database skills and statuses. See [`skillParser.pegjs`](../app/data/mrP/skillParser.pegjs) and [`statusParser.pegjs`](../app/data/mrP/statusParser.pegjs), as well as the TypeScript code under [`app/data/mrP`](../app/data/mrP) that formats skill effects based on the parsers' output.

This section of code is hard to maintain: new effects and game mechanics in FFRK require new text in the Community Database that RK²'s parsers need to be updated to handle, and it's easy for quirks or mistakes in the Community Database text to confuse RK²'s parsers. RK² has unit tests to help validate all of this, but they're often not up to date.

**Example**: Updating the parser to handle new soul breaks or statuses, or checking how well the parser can handle new data from the FFRK Community Database:

1. Run `scripts/review-mrp-all.sh` to write the current parser output to text files under `tmp/mrp-after-*.txt`.
2. Run `scripts/approve-mrp-updates.sh` to copy `tmp/mrp-before-*.txt` to `tmp/mrp-after-*.txt`.
3. If you're checking how well the parser can handle new data from the FFRK Community Database, run `yarn get-enlir` now to actually retrieve the new data.
4. If you're working on the parser code, make your changes to the `skillParser.pegjs` and `statusParser.pegjs` grammars and supporting `mrP` TypeScript code, then run `yarn peg` to regenerate the parser code using your changes to the PEG.js grammars.
5. If you want, use the `scripts/parse-...*.ts` scripts to parse individual abilities, soul breaks, and legend materia to test the effects of your changes on individual items.
6. Use the `scripts/review-mrp-*.sh` scripts to verify the effects of your changes on the entire database.
7. Once you're happy, commit your changes and run `scripts/approve-mrp-updates.sh` to save new `tmp/mrp-before-*.txt` files for the next time you go through this procedure.

### Sagas

A handful of longer-running effects are handled by [sagas](https://redux-saga.js.org/); see the [app/sagas](../app/sagas) directory. This includes the following:

- RK² normally merely listens in on FFRK's API requests, but for tasks such as updating dungeon information or getting relic banner details, it can issue FFRK API requests itself. These tasks involve multiple requests, so they're handled by sagas.
- Background or periodic tasks such as responding to network status changes or marking banners as available or unavailable based on the current date and time are handled by sagas.

## Releasing a new version

To release a new version of the RK² desktop application: (These instructions assume the use of a Mac, so that you can support both Mac and PC. Adjust as needed.)

1. Update CHANGELOG.md with the changes.
2. Run `yarn package:all` from your Mac.
3. Locally install the generated application and make sure it works.
4. Run `scripts/release-app.ts` script. This takes care of incrementing the version in `package.json`, uploading the release to GitHub, and drafting a release announcement for Reddit.
5. In the browser tab that the `release-app.ts` script opened, publish the GitHub draft release.
6. In the browser tab that the `release-app.ts` script opened, post an announcement to Reddit.
