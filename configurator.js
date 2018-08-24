#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const request = require("request-promise-native");

function configureTwitter(sources, isFirst)
{
  return inquirer.prompt([
    {
      name: "enabled",
      message: isFirst ? "Configure Twitter source?" : "Configure another Twitter source?",
      type: "confirm",
      default: isFirst
    },
    {
      name: "consumer_key",
      message: "Consumer API key of your Twitter app?",
      filter: input => input.trim(),
      validate: input => !!input,
      when(answers)
      {
        if (!answers.enabled)
          return false;

        console.error("You need to register a developer account on https://developer.twitter.com/ and create a Twitter app.");
        return true;
      }
    },
    {
      name: "consumer_secret",
      message: "Consumer secret key of your Twitter app?",
      filter: input => input.trim(),
      validate: input => !!input,
      when(answers)
      {
        return answers.enabled;
      }
    },
    {
      name: "access_token",
      message: "Access token of your Twitter app?",
      filter: input => input.trim(),
      validate: input => !!input,
      when(answers)
      {
        return answers.enabled;
      }
    },
    {
      name: "access_token_secret",
      message: "Access token secret of your Twitter app?",
      filter: input => input.trim(),
      validate: input => !!input,
      when(answers)
      {
        return answers.enabled;
      }
    },
  ]).then(answers =>
  {
    if (!answers.enabled)
      return undefined;

    delete answers.enabled;
    answers.type = "twitter";
    sources.push(answers);
    return configureTwitter(sources, false);
  });
}

function configureMastodon(sources, isFirst)
{
  return inquirer.prompt([
    {
      name: "enabled",
      message: isFirst ? "Configure Mastodon source?" : "Configure another Mastodon source?",
      type: "confirm",
      default: false
    },
    {
      name: "base_uri",
      message: "Mastodon instance you are registered with?",
      default: "mastodon.social",
      filter(input)
      {
        input = input.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        if (input)
          input  = "https://" + input;
        return input;
      },
      transformer: input => input.replace(/^https:\/\//, ""),
      validate(input, answers)
      {
        if (!input)
          return false;

        return request({
          method: "POST",
          uri: input + "/api/v1/apps",
          form: {
            client_name: "Twitter to RSS converter",
            redirect_uris: "urn:ietf:wg:oauth:2.0:oob",
            scopes: "read"
          },
          transform: JSON.parse
        }).then(({client_id, client_secret}) =>
        {
          answers.client_id = client_id;
          answers.client_secret = client_secret;
          return true;
        });
      },
      when(answers)
      {
        return answers.enabled;
      }
    },
    {
      name: "authorization_code",
      message: "Mastodon authorization code?",
      filter: input => input.trim(),
      when(answers)
      {
        if (!answers.enabled)
          return false;

        let url = answers.base_uri +
                  "/oauth/authorize?scope=read&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob&client_id=" +
                  encodeURIComponent(answers.client_id);
        console.error(`Please visit ${url} in your browser to authorize the app and retrieve your authorization code.`);
        return true;
      },
      validate(input, answers)
      {
        if (!input)
          return false;

        return request({
          method: "POST",
          uri: answers.base_uri + "/oauth/token",
          form: {
            client_id: answers.client_id,
            client_secret: answers.client_secret,
            grant_type: "authorization_code",
            code: input,
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob"
          },
          transform: JSON.parse
        }).then(data =>
        {
          answers.access_token = data.access_token;
          return true;
        });
      }
    }
  ]).then(answers =>
  {
    if (!answers.enabled)
      return undefined;

    delete answers.enabled;
    delete answers.authorization_code;
    answers.type = "mastodon";
    sources.push(answers);
    return configureMastodon(sources, false);
  });
}

inquirer.prompt([
  {
    name: "port",
    message: "Which port should the server run on?",
    default: "16144",
    filter: input => parseInt(input.trim(), 10),
    validate: input =>
    {
      if (isNaN(input) || input < 1 || input > 65535)
      {
        console.error();
        console.error("Please input a valid port number between 1 and 65535");
        return false;
      }
      return true;
    }
  },
  {
    name: "ip",
    message: "Which IP address to bind the server to?",
    default: "127.0.0.1",
    filter: input => input.trim(),
    validate: input => !!input
  }
]).then(config =>
{
  if (config.ip != "127.0.0.1" && config.ip != "::1")
    console.error("Warning: your server might be reachable from the network. Continue at your own risk!");

  config.sources = [];
  return configureTwitter(config.sources, true)
    .then(() => configureMastodon(config.sources, true))
    .then(() => config);
}).then(config =>
{
  if (!config.sources.length)
    console.error("Warning: You didn't configure any data sources.");

  let filename = path.join(__dirname, "config.json");
  fs.writeFileSync(filename, JSON.stringify(config, undefined, 2));
  console.log("Config file written: " + filename);
});
