ALL.getHostJs(function ()
{
  window.GRAPH = window.GRAPH || {};

  var spaceKey = URI.getQueryParam("spaceKey");

  if (!spaceKey)
  {
    console.log("No spaceKey query parameter, bailing out.");
    return;
  }

  var spaceNodeId = 0;

  var nodes = [
    {id: spaceNodeId, label: spaceKey, group: "space"}
  ];

  var edges = [
  ];

  var container = document.getElementById('space-graph');
  var data = {
    nodes: nodes,
    edges: edges
  };

  var options = {
    width: $(window).width() + 'px',
    height: '800px',
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
        shape: "star",
        radius: 40,
        radiusMin: 40,
        color: {background: "#f6c342", border: "#ffe9a8"}
      },
      page: {
        shape: "box",
        color: {background: "#ebf2f9", border: "#3b73af"},
        fontColor: "#ffffff"
      }
    }
  };

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

    return {
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
      createdBy: page.creator
    }
  }

  var graph = window.GRAPH.graph = new vis.Graph(container, data, options);

  graph.on('select', function (selected)
  {
    if (selected.nodes.length === 0)
    {
      // nothing
      UI.clearGraphPanel();
    }
    else if (selected.nodes.length === 1)
    {
      var selectedNode = graph.nodesData.get(selected.nodes[0]);
      UI.displayPage(selectedNode);
    }
    else
    {
      var selectedNodes = [];
      for (var i = 0; i < selected.nodes.length; i++) {
        selectedNodes.push(graph.nodesData.get(selected.nodes[0]));
      }
      UI.displayPages(selectedNodes);
    }
  });

  function crawlSpace(space)
  {
    for (var i = 0; i < space.rootpages.size; i++)
    {
      var page = space.rootpages.content[i];
      crawlPage(page.id, spaceNodeId);
    }
  }

  function crawlPage(pageId, parentId)
  {
    AP.request({
      url: "/rest/prototype/1/content/" + pageId + ".json?expand=children",
      success: function (response)
      {
        var page = JSON.parse(response);
        graph.nodesData.add(generateNode(page));
        graph.edgesData.add({from: parentId, to: page.id});
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