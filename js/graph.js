ALL.getHostJs(function (AP)
{
  window.GRAPH = window.GRAPH || {};

  window.spaceKey = URI.getQueryParam("spaceKey");

  GRAPH.getSpaceNodeId = function() {
    return 0;
  };

  var nodes = [
    {id: GRAPH.getSpaceNodeId(), group: "space"}
  ];

  var edges = [
  ];

  var container = document.getElementById('space-graph');
  var data = {
    nodes: nodes,
    edges: edges
  };

  var graphWidth = $(window).width();
  var graphHeight = window.outerHeight - 265; // magic number for header + footer - TODO expose AP. API for getting parent window height

  // hack for the time being - in case window.outerHeight fails in some browsers
  if (!graphHeight) {
    graphHeight = 800;
  }

//  console.log("Creating graph: " + graphWidth + "x" + graphHeight);

  var options = {
    width: graphWidth + 'px',
    height: graphHeight + 'px',
    physics: {
      barnesHut: {
        enabled: true,
        gravitationalConstant: -2000,
        centralGravity: 0.1,
        springLength: 95,
        springConstant: 0.04,
        damping: 0.09
      },
      repulsion: {
        centralGravity: 0.1,
        springLength: 50,
        springConstant: 0.05,
        nodeDistance: 200,
        damping: 0.09
      }
    },
    groups: {
      space: {
        shape: "image",
        image: ALL.hostBaseUrl + "/images/logo/default-space-logo-48.png"
      },
      page: {
        shape: "box",
        color: {background: "#ebf2f9", border: "#3b73af"},
        fontColor: "#ffffff"
      },
      collapsed: {
        shape: "image",
        image: "image/pages.png",
        fontColor: "#707070"
      }
    },
    tooltip: {
      delay: 50,
      fontColor: "black",
      fontFace: "arial",
      color: {
        background: "rgba(255, 255, 255, .9)",
        border: "#cccccc"
      }
    }
  };

  var graph = GRAPH.graph = new vis.Graph(container, data, options);

  var nowMs = new Date().getTime();

  function daysSince(dateString) {
    var msSince = nowMs - dateFromString(dateString).getTime();
    return Math.floor(msSince / (1000 * 60 * 60 * 24));
  }

  // adapted from http://stackoverflow.com/a/9413229/2484180
  function dateFromString(dateString) {
    var a = $.map(dateString.split(/[^0-9]/), function(s) { return parseInt(s, 10) });
    return new Date(a[0], a[1] - 1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
  }

  var maxModeValues = {
    daysSinceUpdated: 0,
    daysSinceCreated: 0,
    attachments: 0,
    comments: 0,
    depth: 0
  };

  function generateNode(page, depth)
  {
    var daysSinceUpdated = daysSince(page.lastModifiedDate.date);
    var daysSinceCreated = daysSince(page.createdDate.date);

    maxModeValues.daysSinceUpdated = Math.max(maxModeValues.daysSinceUpdated, daysSinceUpdated);
    maxModeValues.daysSinceCreated = Math.max(maxModeValues.daysSinceCreated, daysSinceUpdated);
    maxModeValues.attachments = Math.max(maxModeValues.attachments, page.attachments.size);
    maxModeValues.comments = Math.max(maxModeValues.comments, page.comments.total);
    maxModeValues.depth = Math.max(maxModeValues.depth, depth);

    var node = {
      id: page.id,
      label: page.title,
      group: "page",
      color: {
        background: "white",
        border: "#707070"
      },
      fontColor: "#707070",
      daysSinceUpdated: daysSinceUpdated,
      updatedBy: page.lastModifier,
      daysSinceCreated: daysSinceCreated,
      createdBy: page.creator,
      title: function() {
        return UI.getTooltipHtml(node);
      },
      attachments: page.attachments.size,
      comments: page.comments.total,
      depth: depth,
      children: page.children.size
    };

    return node;
  }

  var invertedModes = ["attachments", "comments"];

  GRAPH.applyColorMode = function(mode) {
    var nodes = graph.nodesData.get();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node.id === GRAPH.getSpaceNodeId()) {
        // the space node doesn't have any mode data
        continue;
      }

      if (node.group === "collapsed") {
        // we'll deal with you later
        continue;
      }

      var value = node[mode];
      var max = maxModeValues[mode];

      var maxRatio = 75;

      var ratio;
      if (value === 0) {
        ratio = 0;
      } else {
        ratio = (value / max) * maxRatio;
      }

      if (invertedModes.indexOf(mode) > -1) {
        ratio = maxRatio - ratio;
      }

      node.color = {
        background: tinycolor.lighten("#205081", ratio).toHexString(),
        border: "#707070"
      };
      node.fontColor = ratio > 30 ? "#000000" : "#ffffff";
      graph.nodesData.update(node);
    }
  };

  GRAPH.getSelectedPages = function() {
    return idsToNodes(graph.getSelection().nodes);
  };

  GRAPH.clearSelection = function() {
    graph.setSelection([]);
  };

  GRAPH.setSelectedPages = function(selection) {
    if (!selection) {
      GRAPH.clearSelection();
      return;
    }

    if ((!selection instanceof Array)) {
      selection = [selection];
    }

    if (selection[0] instanceof Object) {
      selection = _.pluck(selection, "id");
    }

    graph.setSelection(selection);
  };

  GRAPH.deselect = function(pageId) {
    var selected = graph.getSelection().nodes;
    var index = selected.indexOf(pageId + "");
    if (index > -1) {
      selected.splice(index, 1);
    }
    graph.setSelection(selected);
  };

  var customClickHandler;

  GRAPH.setClickHandler = function(fn) {
    customClickHandler = fn;
  };

  GRAPH.clearClickHandler = function() {
    customClickHandler = undefined;
  };

  GRAPH.reparent = function(childId, newParentId) {
    var child = graph.nodesData.get(childId);

    // remove edge to old parent
    graph.edgesData.remove(child.edgeToParent);

    // add edge to new parent
    var createdEdges = graph.edgesData.add({from: newParentId, to: childId});
    child.edgeToParent = createdEdges[0];
    graph.nodesData.update(child);
  };

  GRAPH.reparentChildren = function(oldParentId, newParentId) {
    var oldParent = graph.nodesData.get(oldParentId);
    if (oldParent.group === "collapsed") {
      explodeCollapsedNode(oldParent);
    }

    var children = graph.nodesData.get({
      filter: function(item) {
        return item.edgeToParent && graph.edgesData.get(item.edgeToParent).from === oldParentId;
      }
    });

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var edge = graph.edgesData.get(child.edgeToParent);
      edge.from = newParentId;
      graph.edgesData.update(edge);
    }
  };

  GRAPH.remove = function(pageId) {
    graph.nodesData.remove(pageId);
  };

  graph.on('select', function (selected) {
    var selectedNodes = idsToNodes(selected.nodes);

    for (var i = 0; i < selectedNodes.length; i++) {
      var node = selectedNodes[i];
      if (node.group === "collapsed") {
        explodeCollapsedNode(node);
        selectedNodes = selectedNodes.splice(i, 1);
      }
    }

    if (customClickHandler) {
      customClickHandler(selectedNodes);
    }
  });

  function idsToNodes(ids) {
    var nodes = [];
    for (var i = 0; i < ids.length; i++) {
      nodes.push(graph.nodesData.get(ids[0]));
    }
    return nodes;
  }

  function crawlSpace(space) {
    graph.nodesData.update({id: GRAPH.getSpaceNodeId(), label: space.name, group: "space"});
    for (var i = 0; i < space.rootpages.size; i++) {
      var page = space.rootpages.content[i];
      crawlPage(page.id, GRAPH.getSpaceNodeId(), 1); // depth is one based
    }
  }

  var pagesLoaded = 0;
  var outstandingRequests = 0;

  function crawlPage(pageId, parentId, depth) {
    outstandingRequests++;
    AP.request({
      url: "/rest/prototype/1/content/" + pageId + ".json?expand=children",
      success: function (response) {

        var page = JSON.parse(response);

        if (page.children.size > 0) {
          // create page node
          graph.nodesData.add(generateNode(page, depth));

          // create edge from the page to its parent
          var createdEdges = graph.edgesData.add({from: parentId, to: page.id});
          var pageNode = graph.nodesData.get(page.id);
          pageNode.edgeToParent = createdEdges[0];
          graph.nodesData.update(pageNode);

          for (var i = 0; i < page.children.size; i++)
          {
            var childPage = page.children.content[i];
            crawlPage(childPage.id, pageId, depth + 1);
          }
        } else {
          var parent = graph.nodesData.get(parentId);
          if (parent.group === "collapsed") {
            parent.collapsed.push(generateNode(page, depth));
          } else {
            parent.group = "collapsed";
            parent.collapsed = [generateNode(page, depth)];
          }
          graph.nodesData.update(parent);
        }

        if (--outstandingRequests) {
          UI.showMessage(++pagesLoaded + " pages found");
        } else {
          UI.showMessage(++pagesLoaded + " pages found", 2000);
          GRAPH.applyColorMode("daysSinceUpdated");
        }

      }
    });
  }

  function explodeCollapsedNode(collapsedNode) {

    var collapsedPhysicsNode = graph.nodes[collapsedNode.id];

    for (var i = 0; i < collapsedNode.collapsed.length; i++) {
      var collapsedChildNode = collapsedNode.collapsed[i];

      // create edge from the page to its parent TODO refactor copy-pasta
      graph.nodesData.add(collapsedChildNode);

      var createdEdges = graph.edgesData.add({from: collapsedNode.id, to: collapsedChildNode.id});
      var pageNode = graph.nodesData.get(collapsedChildNode.id);
      pageNode.edgeToParent = createdEdges[0];
      graph.nodesData.update(pageNode);

      // move the node to near where it's parent was (with some randomness - two nodes occupying the same space cause havoc!)
      var collapsedChildPhysicsNode = graph.nodes[collapsedChildNode.id];
      collapsedChildPhysicsNode.x = collapsedPhysicsNode.x + 10 * Math.random();
      collapsedChildPhysicsNode.y = collapsedPhysicsNode.y + 10 * Math.random();
    }

    collapsedNode.group = "page";
    graph.nodesData.update(collapsedNode);

    GRAPH.deselect(collapsedNode.id);
    GRAPH.applyColorMode($("#mode-select").val());
  }

  if (spaceKey)
  {
    AP.request({
      url: "/rest/prototype/1/space/" + spaceKey + ".json?expand=rootpages",
      success: function (response)
      {
        crawlSpace(JSON.parse(response));
      }
    });
  } else {
    // do 404
    var circleCount = 100;
    for (var i = 1; i <= circleCount; i++) {
      graph.nodesData.add({id: i, label: " "});
    }
    for (var i = 1; i <= circleCount; i++) {
      graph.edgesData.add({from: i, to: (i % circleCount) + 1});
    }
    graph.nodesData.remove(0);
    $("#mode-select-container").hide();
    UI.showMessage("There's no space here, or you're not allowed to see it.")  ;
  }

});