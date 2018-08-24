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

  get html()
  {
    return this._tootToHTML(this._data);
  }

  get html_simple()
  {
    return this._data.content;
  }

  _tootToHTML(toot)
  {
    if (toot.reblog)
    {
      return this._quoteToot(toot.reblog).then(html =>
      {
        return `Boosted: ${html}`;
      });
    }

    let html = toot.content;
    for (let {type, url, preview_url} of toot.media_attachments)
    {
      if (type == "image")
        html += `<a href="${escape(url)}"><img style="display: block; margin: 12px 0;" src="${escape(preview_url)}" /></a>`;
      else if (type == "video" || type == "gifv")
        html += `<video style="display: block; margin: 12px 0;" controls="controls" poster="${escape(preview_url)}" src="${escape(url)}" />`;
    }

    return this._request.get(`/api/v1/statuses/${toot.id}/card`).then(data =>
    {
      if (!data.url)
        return html;

      html += '<div style="margin: 12px 0; padding: 0 12px; border: 1px solid #e6ecf0; border-radius: 4px;">';
      if (data.image)
        html += `<p><img src="${escape(data.image)}" width="${escape(data.width)}" height="${escape(data.height)}" style="float: left; margin-right: 12px;" /></p>`;
      html += `<p><a href="${escape(data.url)}">${escape(data.title)}</a></p>`;
      html += `<p>${escape(data.description)}</p>`;
      if (data.html)
        html += data.html;
      html += "</div>";
      return html;
    }).catch(err =>
    {
      if (err.name != "StatusCodeError")
        console.log(err);
      return html;
    });
  }

  _quoteToot(toot)
  {
    let entry = new Entry(toot);

    return this._tootToHTML(toot).then(html =>
    {
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
          ${html}
        </div>`;
    });
  }
}

module.exports = Entry;
