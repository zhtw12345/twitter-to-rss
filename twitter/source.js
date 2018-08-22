"use strict";

const Request = require("twit");
const Entry = require("./entry");

module.exports = function(config)
{
  config = Object.assign({}, config, {
    timeout_ms: 20 * 1000,
    strictSSL: true
  });
  return new Request(config).get("statuses/home_timeline", {
    count: 200,
    tweet_mode: "extended",
    include_entities: true
  }).then(({data: entries, resp}) =>
  {
    return entries.map(entry => new Entry(entry));
  });
};
