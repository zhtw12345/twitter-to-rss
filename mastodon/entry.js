"use strict";

const {escape} = require("../utils");

class Entry
{
  constructor(data, request)
  {
    this._data = data;
    this._request = request;
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

  get data()
  {
    return this._data;
  }

  get html()
  {
    return Promise.resolve(this._tootToHTML(this._data));
  }

  get html_simple()
  {
    return this._data.content;
  }

  _tootToHTML(toot)
  {
    if (toot.reblog)
      return `Boosted: ${this._quoteToot(toot.reblog)}`;

    let html = toot.content;
    for (let {type, url, preview_url} of toot.media_attachments)
    {
      if (type == "image")
        html += `<a href="${escape(url)}"><img style="display: block; margin: 12px 0;" src="${escape(preview_url)}" /></a>`;
      else if (type == "video" || type == "gifv")
        html += `<video style="display: block; margin: 12px 0;" controls="controls" poster="${escape(preview_url)}" src="${escape(url)}" />`;
    }

    if (toot.card)
    {
      let card = toot.card;
      html += '<div style="margin: 12px 0; padding: 0 12px; border: 1px solid #e6ecf0; border-radius: 4px;">';
      if (card.image)
        html += `<p><img src="${escape(card.image)}" width="${escape(card.width)}" height="${escape(card.height)}" style="float: left; margin-right: 12px;" /></p>`;
      html += `<p><a href="${escape(card.url)}">${escape(card.title)}</a></p>`;
      html += `<p>${escape(card.description)}</p>`;
      html += '<div style="clear: both;"></div>';
      if (card.html)
        html += card.html;
      html += "</div>";
    }
    return html;
  }

  _quoteToot(toot)
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
        ${this._tootToHTML(toot)}
      </div>`;
  }
}

module.exports = Entry;
