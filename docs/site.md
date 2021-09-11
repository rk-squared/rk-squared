# Updating the RK² Web Site

The RK² web site is run by GitHub Pages; see https://github.com/rk-squared/rk-squared.github.io.

Parts of the RK² web site are mined from game data; most notably the relic draw banners. To implement this, the site is published with a (sanitized) copy of the Redux store of the RK² desktop application, containing the data mined from a developer who plays FFRK using RK². The site build process takes a copy of the store and bundles it into the React application that makes up the site. (A possible improvement would be to better separate these so that new banners don't require rebuilding the site application.)

Therefore, to publish a new version of the site:

1. Clone out a copy of this repository so that you have all of the development tools. (See [prerequisites.md](./prerequisites.md)).
2. Clone a copy of the `rk-squared.github.io` repository next to your copy of the `rk-squared` repository. (For example, if you cloned git@github.com:rk-squared/rk-squared.git to `c:\src\rk-squared`, then clone git@github.com:rk-squared/rk-squared.github.io.git to `c:\src\rk-squared.github.io`.)
3. Run the RK² application (either an official release or a development build).
4. Configure FFRK to use RK².
5. Within FFRK, go to the latest relic banners and dungeons.
6. Verify that the RK² application has all of the latest relic banner and dungeon details.
7. Exit RK² to make sure that it fully saves its game state to disk.
8. Run `scripts/build-and-publish-site.sh`. This will take a few minutes to run; as soon as you see its initial `Exported ...config.json to ...tmp/store.json` message, you can restart RK².

The `build-and-publish-site.sh` script assumes that you're set up to push to GitHub from the command line; for this to work, you may need to store your password in your Git client or set up an SSH key for GitHub, or you can instead use a graphical Git client like GitHub Desktop. You can find more information these tools online.
