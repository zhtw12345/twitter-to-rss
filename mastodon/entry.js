"use strict";

const {escape} = require("../utils");

function quoteToot(toot)
{
  let entry = new Entry(toot);

  return `
    <div style="border: 1px solid #e6ecf0; border-radius: 4px; padding: 0 12px;">
      <p>
        <a href="${escape(entry.author_screen_name)}">
          <strong>${escape(entry.author_display_name)}</strong>
          ${escape(entry.author_screen_name)}
        </a>
        &middot;
        <a href="${escape(entry.url)}">
          ${escape(entry.date.toISOString())}
        </a>
      </p>
      ${tootToHTML(toot)}
    </div>`;
}

function tootToHTML(toot)
{
  if (toot.reblog)
    return `RT: ${quoteToot(toot.reblog)}`;

  let html = toot.content;
  for (let {type, url, preview_url} of toot.media_attachments)
  {
    if (type == "image")
      html += `<a href="${escape(url)}"><img style="display: block; margin: 12px 0;" src="${escape(preview_url)}" /></a>`;
    else if (type == "video")
      html += `<video style="display: block; margin: 12px 0;" controls="controls" poster="${escape(preview_url)}" src="${escape(url)}" />`;
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
    return this._data.account.display_name;
  }

  get author_screen_name()
  {
    return this._data.account.url;
  }

  get url()
  {
    return this._data.reblog ? this._data.reblog.url : this._data.uri;
  }

  get html()
  {
    return tootToHTML(this._data);
  }

  get html_simple()
  {
    return this._data.content;
  }
}

module.exports = Entry;
