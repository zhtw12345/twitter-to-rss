Twitter to RSS converter
========================

This is a project for personal use, meant to enable viewing your Twitter and Mastodon home timeline in Thunderbird. Setting up is far from trivial, and depending on your use case the results might be suboptimal. You have been warned.

Installing prerequisites
------------------------

This project requires [Node.js](https://nodejs.org/) to be installed. To install additional dependencies, run the following command in the project directory:

    npm install

Initial setup
-------------

To create your `config.json` file, run `configurator.js` script. It will guide you through configuration of the Twitter and Mastodon sources. Note that in order to use Twitter, you have to register as a developer on [developer.twitter.com](https://developer.twitter.com/) and create an app. Twitter doesn't support automatic app creation, and restrictive quotas don't allow a single app registration to be reused for all potential users.

Starting server
---------------

To start the server, run the following command in the project directory:

    npm start

This will start the converter, on [http://127.0.0.1:16144/](http://127.0.0.1:16144/) by default. You can add this address to your RSS feed reader and start reading. Mind you, display is optimized for Thunderbird and might be suboptimal for other feed readers.

Known limitations
-----------------

* Card display in Twitter is very suboptimal - lots of scrolling and occasional "Not found" page if no card exists.
* No card display with Mastodon.
* Twitter feed doesn't show other people's likes, unlike the web version.
