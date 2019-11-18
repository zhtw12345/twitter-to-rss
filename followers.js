#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

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
  process.exit(1);
}

let sources = [];
for (let source_config of config.sources)
{
  if (source_config.type == "twitter")
    sources.push(require("./twitter/source").getFollowers(source_config));
  else if (source_config.type == "mastodon")
    sources.push(require("./mastodon/source").getFollowers(source_config));
  else
    console.error(`Unknown source type in config file: ${source_config.type}`);
}

Promise.all(sources).then(results =>
{
  let followers = [];
  for (let result of results)
    followers.push(...result.keys());
  followers.sort();

  let followerpath = path.join(__dirname, "followers.json");
  let oldFollowers = [];
  try
  {
    oldFollowers = JSON.parse(fs.readFileSync(followerpath));
  }
  catch(e)
  {
    // ignore
  }

  if (oldFollowers.length)
  {
    let logEntry = [];
    for (let follower of oldFollowers)
      if (followers.indexOf(follower) < 0)
        logEntry.push(`-${follower}`);
    for (let follower of followers)
      if (oldFollowers.indexOf(follower) < 0)
        logEntry.push(`+${follower}`);
    if (logEntry.length)
    {
      let logpath = path.join(__dirname, "followerslog.txt");
      fs.appendFileSync(logpath, `${new Date().toISOString()}: ${logEntry.join(" ")}\n`);
    }
  }

  fs.writeFileSync(followerpath, JSON.stringify(followers));
});
