"use strict";

const substr = require("unicode-substring");
const {escape} = require("../utils");

function quoteTweet(tweet)
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
        ${tweetToHTML(tweet)}
      </p>
    </div>`;
}

function tweetToHTML(tweet)
{
  if (tweet.retweeted_status)
    return `RT: ${quoteTweet(tweet.retweeted_status)}`;

  let html = tweet.full_text.replace(/\n/g, "\0");

  let replacements = [];
  for (let {indices: [start, end], text} of tweet.entities.hashtags)
    replacements.push({start, end, text: `<a href="https://twitter.com/hashtag/${escape(text)}">#${escape(text)}</a>`});

  for (let {indices: [start, end], screen_name} of tweet.entities.user_mentions)
    replacements.push({start, end, text: `<a href="https://twitter.com/${escape(screen_name)}">@${escape(screen_name)}</a>`});

  let has_card = false;
  for (let {indices: [start, end], url, expanded_url, display_url} of tweet.entities.urls)
  {
    let replacement = `<a href="${escape(expanded_url)}">${escape(display_url)}</a>`;
    if (tweet.quoted_status && url == tweet.quoted_status_permalink.url)
      replacement = quoteTweet(tweet.quoted_status);
    else
      has_card = true;

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
    has_card = false;
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

  html = html.replace(/\0/g, "<br />");
  if (has_card)
  {
    let card_url = `https://twitter.com/i/cards/tfw/v1/${escape(tweet.id_str)}?cardname=summary_large_image&card_height=200`;
    html += `<iframe style="display: block; margin: 12px 0; border: 1px solid #e6ecf0; border-radius: 4px; width: 100%; height: 218px;" src="${card_url}"></iframe>`;
  }

  return html;
}

class Entry
{
  constructor(data)
  {
    this._data = data;
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
    return tweetToHTML(this._data);
  }

  get html_simple()
  {
    return this._data.full_text;
  }
}

module.exports = Entry;
