getHostJs(function() {

  var spaceKey = getQueryParam("spaceKey");

  if (!spaceKey) {
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
    width: '1200px',
    height: '600px',
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
      page : {
        shape: "box",
        color: {background: "#ebf2f9", border: "#3b73af"},
        fontColor: "#ffffff"
      }
    }
  };

  var nowMs = new Date().getTime();

  function generateColor(page) {
    var ageMs = nowMs - new Date(page.lastModifiedDate.date).getTime();
    var ageDays = ageMs / (1000 * 60 * 60 * 24);

    var ageRatio = Math.min((ageDays / (365 * 3) * 50), 50);

    var border = tinycolor.lighten("#205081", ageRatio);
    var background = tinycolor.desaturate(tinycolor.lighten("#3b73af", ageRatio), ageRatio);

    return {background: background.toHexString(), border: border.toHexString()};
  }

  window.spaceGraph = new vis.Graph(container, data, options);
  
  function crawlSpace(space) {
    for (var i = 0; i < space.rootpages.size; i++) {
      var page = space.rootpages.content[i];
      crawlPage(page.id, spaceNodeId);
    }
  }

  function crawlPage(pageId, parentId) {    
    AP.request({
      url: "/rest/prototype/1/content/" + pageId + ".json?expand=children", 
      success: function(response) {
        var page = JSON.parse(response);        
        spaceGraph.nodesData.add({
          id: page.id, 
          label: page.title, 
          group: "page", 
          color: generateColor(page)
        });
        spaceGraph.edgesData.add({from: parentId, to: page.id});
        for (var i = 0; i < page.children.size; i++) {
          var childPage = page.children.content[i];
          crawlPage(childPage.id, pageId);
        }        
      }
    });
  }  

  AP.request({
    url: "/rest/prototype/1/space/" + spaceKey + ".json?expand=rootpages", 
    success: function(response) {
      crawlSpace(JSON.parse(response));
    }
  });

});