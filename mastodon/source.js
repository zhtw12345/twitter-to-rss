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
