"use strict";

const url = require("url");
const request = require("request-promise-native");

class Request
{
  constructor(config)
  {
    this._config = config;
  }

  get(uri)
  {
    return this._request("GET", uri);
  }

  post(uri, form)
  {
    return this._request("POST", uri, form);
  }

  _request(method, uri, form)
  {
    uri = url.resolve(this._config.base_uri, uri);

    let params = {
      method,
      uri,
      headers: {
        Authorization: "Bearer " + this._config.access_token
      },
      transform: JSON.parse
    };

    if (form)
      params.form = form;
    if (this._config.timeout_ms)
      params.timeout = this._config.timeout_ms;
    if (this._config.strictSSL)
      params.strictSSL = this._config.strictSSL;

    return request(params);
  }
}

module.exports = Request;
