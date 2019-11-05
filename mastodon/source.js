"use strict";

const Request = require("./request");
const Entry = require("./entry");

module.exports = function(config)
{
  config = Object.assign({
    timeout_ms: 20 * 1000,
    strictSSL: true
  }, config);

  let request = new Request(config);
  return request.get("/api/v1/timelines/home?limit=40").then(entries =>
  {
    return entries.map(entry => new Entry(entry, request));
  });
};

module.exports.getFollowers = function(config)
{
  config = Object.assign({
    timeout_ms: 20 * 1000,
    strictSSL: true
  }, config);

  let request = new Request(config);
  let handles = new Set();
  let domain = new URL(config.base_uri).hostname;

  function handleResponse(users)
  {
    for (let user of users)
    {
      if (user.acct.lastIndexOf("@") > 0)
        handles.add(`@${user.acct}`);
      else
        handles.add(`@${user.acct}@${domain}`);
    }
    if (users._response.headers.hasOwnProperty("link"))
    {
      let links = users._response.headers.link;
      for (let link of links.split(/\s*,\s*/))
      {
        let params = link.split(/\s*;\s*/);
        if (params.some(p => /^rel=".*\bnext\b.*"$/.test(p)) && params[0].startsWith("<") && params[0].endsWith(">"))
          return request.get(params[0].slice(1, -1)).then(handleResponse);
      }
    }
    return handles;
  }

  return request.get("/api/v1/accounts/verify_credentials").then(account =>
  {
    return request.get(`/api/v1/accounts/${account.id}/followers?limit=80`);
  }).then(handleResponse);
};
