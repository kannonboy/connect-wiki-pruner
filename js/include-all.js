// stub out console for older browsers

(function() {
  function noop () {}

  window.console = window.console || {
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: noop
  };

})();

// URI utilities

(function() {

  window.URI = window.URI || {};

  URI.getQueryParam = function (name) {
    var match = new RegExp("(\\?|&)" + name + "=([^&]+)").exec(location.search);
    return match && decodeURIComponent(match[2]);
  };

})();

// Include all.js from the host

(function ()
{
  window.ALL = window.ALL || {};

  ALL.getHostJs = function (callback)
  {

    var path = URI.getQueryParam("cp");
    var host = URI.getQueryParam("xdm_e");

    if (!(path && host))
    {
      console.log("No host / path, not including all.js");
      return;
    }

    // TODO validate host is atlassian.net, jira-dev.com, jira.com or localhost

    $.getScript(host + path + "/atlassian-connect/all-debug.js", function ()
    {
      callback && callback();
    });

  };

})();