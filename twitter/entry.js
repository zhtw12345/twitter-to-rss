"use strict";

const {parse} = require("node-html-parser");
const request = require("request-promise-native");
const substr = require("unicode-substring");
const {escape} = require("../utils");

class Entry
{
  constructor(data, config)
  {
    this._data = data;
    this._config = config;
  }

  get date()
  {
    return new Date(this._data.created_at);
  }

  get author_display_name()
  {
    return this._data.user.name;
  }

  get author_screen_name()
  {
    return "@" + this._data.user.screen_name;
  }

  get url()
  {
    return `https://twitter.com/${this._data.user.screen_name}/status/${this._data.id_str}`;
  }

  get html()
  {
    return this._tweetToHTML(this._data);
  }

  get html_simple()
  {
    return this._data.full_text;
  }

  _quoteTweet(tweet)
  {
    return this._tweetToHTML(tweet).then(html =>
    {
      return `
        <div style="border: 1px solid #e6ecf0; border-radius: 4px; padding: 0 12px;">
          <p>
            <a href="https://twitter.com/${escape(tweet.user.screen_name)}">
              <strong>${escape(tweet.user.name)}</strong>
              @${escape(tweet.user.screen_name)}
            </a>
            &middot;
            <a href="https://twitter.com/statuses/${escape(tweet.id_str)}">
              ${escape(new Date(tweet.created_at).toISOString())}
            </a>
          </p>
          <p>
            ${html}
          </p>
        </div>`;
    });
  }

  _tweetToHTML(tweet)
  {
    if (tweet.retweeted_status)
      return this._quoteTweet(tweet.retweeted_status).then(html => `RT: ${html}`);

    return (tweet.quoted_status ? this._quoteTweet(tweet.quoted_status) : Promise.resolve(null)).then(quoted =>
    {
      let html = tweet.full_text.replace(/\n/g, "\0");

      let replacements = [];
      for (let {indices: [start, end], text} of tweet.entities.hashtags)
        replacements.push({start, end, text: `<a href="https://twitter.com/hashtag/${escape(text)}">#${escape(text)}</a>`});

      for (let {indices: [start, end], screen_name} of tweet.entities.user_mentions)
        replacements.push({start, end, text: `<a href="https://twitter.com/${escape(screen_name)}">@${escape(screen_name)}</a>`});

      for (let {indices: [start, end], url, expanded_url, display_url} of tweet.entities.urls)
      {
        let replacement = `<a href="${escape(expanded_url)}">${escape(display_url)}</a>`;
        if (quoted && url == tweet.quoted_status_permalink.url)
          replacement = quoted;

        replacements.push({start, end, text: replacement});
      }

      let extended_entities = tweet.extended_entities || {};
      for (let media of extended_entities.media || [])
      {
        let {indices: [start, end], type, media_url} = media;
        if (type == "photo")
          replacements.push({start, end, text: `<a href="${escape(media_url)}"><img style="display: block; margin: 12px 0; max-height: 300px;" src="${escape(media_url)}" /></a>`});
        else if (type == "video" || type == "animated_gif")
        {
          let variants = media.video_info.variants.map(({url, content_type}) =>
          {
            return `<source src="${escape(url)}" type="${escape(content_type)}" />`;
          });
          replacements.push({start, end, text: `<video style="display: block; margin: 12px 0; max-height: 300px;" controls="controls" poster="${escape(media_url)}">${variants.join("")}</video>`});
        }
      }

      replacements.sort((a, b) => b.start - a.start);

      for (let i = 1; i < replacements.length; i++)
      {
        if (replacements[i].start == replacements[i - 1].start && replacements[i].end == replacements[i - 1].end)
        {
          replacements[i - 1].text += replacements[i].text;
          replacements.splice(i, 1);
          i--;
        }
      }

      for (let {start, end, text} of replacements)
        html = substr(html, 0, start) + text + substr(html, end);

      html = html.replace(/^(?:<a [^>]+>@[^<>]+<\/a> )+/, match => match.trim() + "\0");

      html = html.replace(/\0/g, "<br />");

      let params = {
        method: "GET",
        uri: `https://twitter.com/i/cards/tfw/v1/${tweet.id_str}`,
        transform: parse
      };

      if (this._config.timeout_ms)
        params.timeout = this._config.timeout_ms;
      if (this._config.strictSSL)
        params.strictSSL = this._config.strictSSL;

      return request(params).then(root =>
      {
        function getAttr(selector, attr)
        {
          let element = root.querySelector(selector);
          if (!element)
            return null;

          if (attr)
            return element.attributes[attr];
          else
            return element.text;
        }

        let url = getAttr("a", "href");
        if (url)
        {
          let title = getAttr("h2") || url;
          let description = getAttr("p");
          let image = getAttr("img", "data-src");

          html += '<div style="margin: 12px 0; padding: 0 12px; border: 1px solid #e6ecf0; border-radius: 4px;">';
          if (image)
            html += `<div><img src="${escape(image)}" style="max-height: 300px;"></div>`;
          html += `<p><a href="${escape(url)}">${escape(title)}</a></p>`;
          if (description)
            html += `<p>${escape(description)}</p>`;
          html += "</div>";
        }
        return html;
      }).catch(err =>
      {
        if (err.name != "RequestError" && err.name != "StatusCodeError")
          console.log(err);
        return html;
      });
    });
  }
}

module.exports = Entry;
