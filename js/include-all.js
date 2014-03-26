(function(){

  window.console = window.console || {log: function() {}};
  
  window.getHostJs = function(callback) {

    function queryParam(name) {
      var match = new RegExp("(\\?|&)" + name + "=([^&]+)").exec(location.search);  
      return match && decodeURIComponent(match[2]);
    }

    var path = queryParam("cp");
    var host = queryParam("xdm_e");

    if (!(path && host)) {
      console.log("No host / path, not including all.js");
      return;
    }

    // TODO validate host is atlassian.net, jira-dev.com, jira.com or localhost

    $.getScript(host + path + "/atlassian-connect/all-debug.js", function() {
      callback && callback();
    });

  };

})();