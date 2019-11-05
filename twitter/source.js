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
    return entries.map(entry => new Entry(entry, config));
  });
};

module.exports.getFollowers = function(config)
{
  config = Object.assign({}, config, {
    timeout_ms: 20 * 1000,
    strictSSL: true
  });

  let request = new Request(config);
  let handles = new Set();

  function handleResponse({data, resp})
  {
    for (let user of data.users)
      handles.add(`@${user.screen_name}@twitter.com`);
    if (data.next_cursor)
    {
      return request.get("followers/list", {
        count: 200,
        cursor: data.next_cursor
      }).then(handleResponse);;
    }
    else
      return handles;
  }

  return request.get("followers/list", {
    count: 200
  }).then(handleResponse);
};
