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
    var pagesToDelete = GRAPH.getSelectedPages();

    var messageHtml = "Delete ";
    if (pagesToDelete.length > 1) {
      messageHtml += pagesToDelete.length + " pages"
    } else {
      var pageTitle = $('<div/>').text(pagesToDelete[0].label).html(); // TODO this is a nasty way to escape
      messageHtml += "<em>" + pageTitle + "</em>";
    }

    messageHtml += "? "
                +  "<a class='message-confirm-delete'>Confirm</a> or "
                +  "<a class='message-cancel-delete'>cancel</a>";

    $message
      .html(messageHtml)
      .find(".message-confirm-delete").on("click", function() {
        UI.hideMessage();
        for (var i = 0; i < pagesToDelete.length; i++) {
          (function () {
            var pageToDelete = pagesToDelete[i];
            AP.request({
              url: "/rpc/json-rpc/confluenceservice-v2/removePage",
              contentType: "application/json",
              type: "POST",
              data: JSON.stringify([pageToDelete.id]),
              success: function (response)
              {
                if (JSON.parse(response) === true) {
                  console.log("Deleted " + pageToDelete.id);
                  GRAPH.reparentChildren(pageToDelete.id, GRAPH.getSpaceNodeId());
                  GRAPH.remove(pageToDelete.id);
                } else {
                  console.error("Failed to delete " + pageToDelete.id + "!");
                }
              }
            });
          })();
        }
      });

    $message.show();
  });

  $message.on("click", ".message-cancel-delete", function() {
    UI.hideMessage();
    GRAPH.clearClickHandler();
  });

  $(".move-page").on("click", function() {
    UI.clearGraphPanel();

    var $cancelLink = $("<a class='message-cancel-move'>cancel</a>");
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
        (function () {
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
                GRAPH.reparent(pageToMove.id, newParent.id);
              } else {
                console.error("Failed to move " + pageToMove.id + " to " + newParent.id + "!");
              }
            }
          });
        })();
      }

      UI.hideMessage();
      GRAPH.clearClickHandler();
    });
  });

  $message.on("click", ".message-cancel-move", function() {
    UI.hideMessage();
    GRAPH.clearClickHandler();
  });

})();