ALL.getHostJs(function (AP)
{
  window.GRAPH = window.GRAPH || {};

  window.spaceKey = URI.getQueryParam("spaceKey");

  if (!spaceKey)
  {
    console.log("No spaceKey query parameter, bailing out.");
    return;
  }

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
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAA3NCSVQICAjb4U/gAAAAyVBMVEX///9wcHBwcHBwcHCzs7NwcHCwsLB0dHRwcHBwcHCurq6tra2Tk5NwcHCrq6twcHBwcHBwcHChoaFwcHCcnJxwcHCZmZlycnJwcHCTk5ONjY2Li4uDg4NycnJwcHD////7+/v39/fz8/Pt7e3r6+vn5+fl5eXi4uLe3t7Z2dnT09PMzMzGxsbDw8O+vr67u7u3t7ewsLClpaWhoaGZmZmUlJSTk5ORkZGLi4uJiYmDg4OBgYF/f396enp4eHh2dnZ0dHRycnJwcHDEausyAAAAQ3RSTlMAESIzRERVVVVmd3d3d4iImaq7u8zM3d3d7u7u7u7u////////////////////////////////////////////////nly5IwAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAUdEVYdENyZWF0aW9uIFRpbWUANi8xLzEzOKlF0AAAAk1JREFUSImNlX97mjAQxwOowzoGymTWrRG0tW6dW2c7V+cguXv/L6pJnEJ+oL1/4Anfz5O7+4YLIWZ0o3SCKiZp1LU+GxEkVCjp/5CvSXBG3k2lJI1D3yOe54dxKpm0bRt/KNWh11zzwrFAhr5LH1KkQ8f+gdiWhvZ6LIps2TsUTYjNxQQx8VxqlZhINjH1tN8mlxEZRHxBT0hfy0rkD1ZkHXOPU+VdRFYaUSGWPY0YIj129wvsZmYUYlOd8CY4PLy9B7a0gBni1iBCxEPfP8OTrRdA8dsgUkzl4x2wOycwyw0iQJQn4RNsHXoJzAojq7EyA+BbGzDLdaKPVPa3cukFsJDN+tMkPCrKTg3TNosj8HgkOo2cInKjmSb9OvR4i6fITkAi+rTnzRKUX4ooagLqIuiEALu1/NJ8nLMaCCgSqArbL42oasAXADKXX0s34EmAW+0v9KxKAyjnJqD8WroAX9Ww1IFj95cOQBa9Zw86cPJrYQOyrVP+qwk0/NrYgDRupB/Wpl82II/GFehVH0P4ZQHq8JGKP7gA0X4LUMebZO4fyAUcfqAesHsXUFpAl6pflEzh+W3A+DAEyAD417cApzFDrmFfXAbqQUY6JWwuA41RST4A/3kJiBvDmJCPwH+cByLjEsqAP+ZngNi6ggTxlLcC9pUls4K/qxbAdSmKykvgz6vcBPIVuK9d0d1rAPaynjeB+XrH2y52EVdTMSur3eb76rYoKlhvXiqxcBO1yGX0MinhnDGGyCWe9c7IVQxG072cyoj/pqOB9fkVP1fisutaV84AAAAASUVORK5CYII="
      },
      page: {
        shape: "box",
        color: {background: "#ebf2f9", border: "#3b73af"},
        fontColor: "#ffffff"
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

  function daysSince(date)
  {
    var msSince = nowMs - new Date(date).getTime();
    return Math.floor(msSince / (1000 * 60 * 60 * 24));
  }

  function generateNode(page)
  {
    var ageDays = daysSince(page.lastModifiedDate.date);

    var adjustedAgeDays = Math.max(ageDays - 90, 0); // consider the last 90 days as fresh
    var ageRatio = Math.min((adjustedAgeDays / (365 * 3) * 50), 50); // decay for the previous 36 months 

    var border = tinycolor.lighten("#205081", ageRatio);
    var background = tinycolor.desaturate(tinycolor.lighten("#3b73af", ageRatio), ageRatio);

    var node = {
      id: page.id,
      label: page.title,
      group: "page",
      color: {
        background: background.toHexString(),
        border: border.toHexString()
      },
      fontColor: ageRatio > 30 ? "#000000" : "#ffffff",
      updatedDays: ageDays,
      updatedBy: page.lastModifier,
      createdDays: daysSince(page.createdDate.date),
      createdBy: page.creator,
      title: function() {
        return UI.getTooltipHtml(node);
      }
    };

    return node;
  }

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
      crawlPage(page.id, GRAPH.getSpaceNodeId());
    }
  }

  function crawlPage(pageId, parentId) {
    AP.request({
      url: "/rest/prototype/1/content/" + pageId + ".json?expand=children",
      success: function (response) {
        var page = JSON.parse(response);
        // create page node
        graph.nodesData.add(generateNode(page));

        // create edge from the page to its parent
        var createdEdges = graph.edgesData.add({from: parentId, to: page.id});
        var pageNode = graph.nodesData.get(page.id);
        pageNode.edgeToParent = createdEdges[0];
        graph.nodesData.update(pageNode);

        for (var i = 0; i < page.children.size; i++)
        {
          var childPage = page.children.content[i];
          crawlPage(childPage.id, pageId);
        }
      }
    });
  }

  AP.request({
    url: "/rest/prototype/1/space/" + spaceKey + ".json?expand=rootpages",
    success: function (response)
    {
      crawlSpace(JSON.parse(response));
    }
  });

});