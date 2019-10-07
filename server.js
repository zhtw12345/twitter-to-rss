#!/usr/bin/env node

"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const {escape, shorten} = require("./utils");

let configpath = path.join(__dirname, "config.json");
let config;
try
{
  config = JSON.parse(fs.readFileSync(configpath));
}
catch (e)
{
  console.error(`Failed reading config file ${configpath}. Maybe run configurator.js?`);
  console.error(e);
}

http.createServer(function handleRequest(req, res)
{
  let sources = [];
  for (let source_config of config.sources)
  {
    if (source_config.type == "twitter")
      sources.push(require("./twitter/source")(source_config));
    else if (source_config.type == "mastodon")
      sources.push(require("./mastodon/source")(source_config));
    else
      console.error(`Unknown source type in config file: ${source_config.type}`);
  }

  Promise.all(sources).then(results =>
  {
    let entries = [];
    for (let result of results)
      entries.push(...result);
    entries.sort((a, b) => b.date - a.date);

    let html_resolvers = [];
    for (let entry of entries)
      html_resolvers.push(Promise.all([entry, entry.html]));
    return Promise.all(html_resolvers);
  }).then(resolved =>
  {
    let html = "";
    for (let [entry, entry_html] of resolved)
    {
      html += `
        <entry>
          <author><name>"${escape(entry.author_display_name)} ${escape(entry.author_screen_name)}" &lt;&gt;</name></author>
          <published>${escape(entry.date.toISOString())}</published>
          <updated>${escape(entry.date.toISOString())}</updated>
          <link rel="alternate" type="text/html" href="${escape(entry.url)}" />
          <id>${escape(entry.url)}</id>
          <title type="html">${escape(shorten(entry.html_simple, 500))}</title>
          <content type="html">${escape(entry_html)}</content>
        </entry>`;
    }

    res.writeHead(200, {
      "Content-Type": "application/atom+xml; charset=utf-8"
    });
    res.end(`<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title type="text">Twitter timeline</title>
        <link rel="self" href="http://${config.ip}:${config.port}/" />
        <link rel="alternate" type="text/html" href="https://twitter.com/" />
        <id>http://${config.ip}:${config.port}/</id>
        <updated>${new Date().toISOString()}</updated>
        ${html}
      </feed>`, "utf-8");
  }).catch(err =>
  {
    console.error(err);
    res.writeHead(500);
    res.end();
  });
}).listen(config.port, config.ip);
