(function() {

  window.UI = window.UI || {};

  var $sidebar = $("#space-graph-sidebar");
  $sidebar.hide(); // start hidden

  var $singleNode = $(".single-node");
  var $multiNode = $(".multi-node");

  var $nodeTitle = $(".node-title");
  var $nodeUpdated = $(".node-updated");
  var $nodeUpdatedBy = $(".node-updated-by");
  var $nodeCreated = $(".node-created");
  var $nodeCreatedBy = $(".node-created-by");

  var $message = $("#space-graph-message");
  $message.hide(); // start hidden

  UI.clearGraphPanel = function() {
    $sidebar.hide();
    $multiNode.hide();
    $singleNode.hide();
  };

  UI.displayPage = function(pageNode) {
    $nodeTitle.text(pageNode.label);
    $nodeUpdated.text(pageNode.updatedDays + " " + (pageNode.ageDays === 1 ? "day" : "days") + " ago");
    $nodeUpdatedBy.text(pageNode.updatedBy ? pageNode.updatedBy.displayName : "Anon");
    $nodeCreated.text(pageNode.createdDays + " " + (pageNode.ageDays === 1 ? "day" : "days") + " ago");
    $nodeCreatedBy.text(pageNode.createdBy ? pageNode.createdBy.displayName : "Anon");

    UI.clearGraphPanel();
    $sidebar.show();
    $singleNode.show();
  };

  UI.displayPages = function(pageNodes) {
    $nodeTitle.text(pageNodes.length + " pages");

    UI.clearGraphPanel();
    $sidebar.show();
    $multiNode.show();
  };

  UI.showMessage = function(message, timeout) {
    $message.text(message).show();
    if (timeout) {
      setTimeout(UI.hideMessage, timeout);
    }
  };

  UI.hideMessage = function() {
    $message.fadeOut();
  };

  // controls

  $(".archive-page").on("click", function() {
    UI.showMessage("Archive it!", 2000);
  });

  $(".delete-page").on("click", function() {
    UI.showMessage("Delete it!", 2000);
  });

  $(".move-page").on("click", function() {
    UI.clearGraphPanel();

    var $cancelLink = $("<a class='message-cancel'>cancel</a>");
    $message.text("Select a new parent page or ")
            .append($cancelLink)
            .show();

    var pagesToMove = GRAPH.getSelectedPages();

    GRAPH.setClickHandler(function(selectedNodes) {
      // make sure we've selected something
      if (selectedNodes.length === 0 || selectedNodes[0].id === pagesToMove[0].id) {
        return;
      }

      // don't allow selection of multiple parents - revert to the original selection
      if (selectedNodes.length > 1) {
        GRAPH.setSelectedPages(pagesToMove);
        return;
      }

      var newParent = selectedNodes[0];

      for (var i = 0; i < pagesToMove.length; i++) {
        var pageToMove = pagesToMove[i];
        AP.request({
          url: "/rpc/json-rpc/confluenceservice-v2/movePage",
          contentType: "application/json",
          type: "POST",
          data: JSON.stringify([pageToMove.id, newParent.id, "append"]),
          success: function (response)
          {
            if (JSON.parse(response) === true) {
              console.log("Moved " + pageToMove.id + " to " + newParent.id);
            } else {
              console.error("Failed to move " + pageToMove.id + " to " + newParent.id + "!");
            }
          }
        });
      }

      UI.hideMessage();
      GRAPH.clearClickHandler();
    });
  });

  $message.on("click", ".message-cancel", function() {
    UI.hideMessage();
  });

})();