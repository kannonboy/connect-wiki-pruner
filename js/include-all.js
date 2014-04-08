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

  var contextPath = URI.getQueryParam("cp");
  var host = URI.getQueryParam("xdm_e");

  ALL.hostBaseUrl = host && contextPath ? host + contextPath : undefined;

  ALL.getHostJs = function (callback)
  {
    if (!ALL.hostBaseUrl)
    {
      console.log("Host parameters missing from query string, not including all.js");
      return;
    }

    // TODO validate host is atlassian.net, jira-dev.com, jira.com or localhost

    $.getScript(host + contextPath + "/atlassian-connect/all-debug.js", function ()
    {
      callback && callback(window.AP);
    });

  };

})();