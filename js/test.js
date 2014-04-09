(function() {

  window.TEST = window.TEST || {};

  TEST.populateDummyData = function(depth, maxPagesPerLevel, maxPages) {
    createPages(depth, maxPagesPerLevel, {pagesLeft: maxPages ? maxPages : 2000});
  };

  function createPages(depth, maxPagesPerLevel, counter, parentId) {

    var pageCount = TEST.randomInt(1, maxPagesPerLevel);

    console.log("depth: " + depth + " pageConunt: " + pageCount + " counter: " + counter);

    for (var i = 0; i < pageCount && counter.pagesLeft > 0; i++, counter.pagesLeft--) {
      var page = {
        space: spaceKey,
        title: "Page " + (TEST.randomInt(1, 99999999999).toString(16)),
        content: "<p>" + TEST.randomString(9999) + "</p>"
      };

      if (parentId) {
        page.parentId = parentId;
      }

      AP.request({
        url: "/rpc/json-rpc/confluenceservice-v2/storePage",
        contentType: "application/json",
        type: "POST",
        data: JSON.stringify(page),
        success: function (response)
        {
          var created = JSON.parse(response);

          GRAPH.graph.nodesData.add(TEST.testNode(created));
          GRAPH.graph.edgesData.add({from: parentId ? parentId : GRAPH.getSpaceNodeId(), to: created.id});

          if (depth > 1) {
            createPages(depth - 1, maxPagesPerLevel, counter, created.id);
          }
        }
      });
    }

  }

  TEST.randomInt = function(min, max) {
    return min + Math.floor(Math.random() * max);
  };

  var randomString = "Lorem ipsum dolor sit amet. ";
  var randomStringLen = randomString.length;

  TEST.randomString = function(maxLength) {
    var n = maxLength / randomStringLen;
    var s = "";
    for (var i = 0; i < n; i++) {
      s += randomString;
    }
    return s.substring(0, maxLength);
  };

  TEST.testNode = function(jsonRpcPage)
  {
    var node = {
      id: jsonRpcPage.id,
      label: jsonRpcPage.title,
      group: "page",
      color: {
        background: "#3b73af",
        border: "#205081"
      },
      fontColor: "#ffffff",
      updatedDays: 0,
      updatedBy: "You",
      createdDays: 0,
      createdBy: "You",
      title: function() {
        return UI.getTooltipHtml(node);
      }
    };
    return node;
  }

})();