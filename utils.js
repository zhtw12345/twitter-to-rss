"use strict";

function escape(text)
{
  text = String(text || "");
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
exports.escape = escape;

function ensureClosed(text, length, opening, closing)
{
  let indexOpening = text.lastIndexOf(opening, length);
  let indexClosing = text.lastIndexOf(closing, length);
  if (indexOpening >= 0 && indexOpening > indexClosing)
  {
    indexClosing = text.indexOf(closing, length);
    if (indexClosing >= 0)
      return indexClosing + 1;
  }
  return length;
}

function shorten(text, length)
{
  if (text.length > length)
  {
    length = ensureClosed(text, length, "<", ">");
    length = ensureClosed(text, length, "&", ";");
  }
  if (text.length > length)
    return text.substr(0, length) + "…";
  else
    return text;
}
exports.shorten = shorten;
