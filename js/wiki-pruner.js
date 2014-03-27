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

  var $sidebar = $("#space-graph-sidebar");
  var sidebarWidth = 300;

  var $nodeTitle = $(".node-title");
  var $nodeDescription = $(".node-description");

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
      page : {
        shape: "box",
        color: {background: "#ebf2f9", border: "#3b73af"},
        fontColor: "#ffffff"
      }
    }
  };

  var nowMs = new Date().getTime();

  function generateNode(page) {
    var ageMs = nowMs - new Date(page.lastModifiedDate.date).getTime();
    var ageDays = ageMs / (1000 * 60 * 60 * 24);

    var ageDays = Math.max(ageDays - 90, 0); // consider the last 90 days as fresh

    var ageRatio = Math.min((ageDays / (365 * 3) * 50), 50); // decay for the previous 36 months 

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
        fontColor: ageRatio > 30 ? "#000000" : "#ffffff"
    }
  }

  window.spaceGraph = new vis.Graph(container, data, options);
  
  function crawlSpace(space) {
    for (var i = 0; i < space.rootpages.size; i++) {
      var page = space.rootpages.content[i];
      $nodeTitle.text(space.name);
      crawlPage(page.id, spaceNodeId);
    }
  }

  function crawlPage(pageId, parentId) {    
    AP.request({
      url: "/rest/prototype/1/content/" + pageId + ".json?expand=children", 
      success: function(response) {
        var page = JSON.parse(response);
        spaceGraph.nodesData.add(generateNode(page));
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