getHostJs(function() {

  var spaceKey = getQueryParam("spaceKey");
  var spaceNodeId = 0;

  var nodes = [
    {id: spaceNodeId, label: spaceKey}  
  ];

  var edges = [    
  ];

  // create a graph
  var container = document.getElementById('space-graph');
  var data = {
    nodes: nodes,
    edges: edges
  };
  
  var options = {
    width: '1200px',
    height: '600px'
  };

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
        spaceGraph.nodesData.add({id: page.id, label: page.title});
        spaceGraph.edgesData.add({from: parentId, to: page.id});
        for (var i = 0; i < page.children.size; i++) {
          var childPage = page.children.content[i];
          crawlPage(childPage.id, pageId);
        }        
      }
    });
  }  

  AP.request({
    url: "/rest/prototype/1/space/TS.json?expand=rootpages", 
    success: function(response) {
      crawlSpace(JSON.parse(response));
    }
  });

});