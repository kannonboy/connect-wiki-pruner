(function() {

  window.UI = window.UI || {};

  // TOOLTIP

  var selectedNode;

  var $tooltipTemplate = $("#space-graph-tooltip-template");

  var $nodeTitle = $(".node-title");
  var $nodeUpdated = $(".node-updated");
  var $nodeUpdatedBy = $(".node-updated-by");
  var $nodeCreated = $(".node-created");
  var $nodeCreatedBy = $(".node-created-by");

  UI.getTooltipHtml = function(pageNode) {
    if (!UI.popupsEnabled()) {
      return undefined;
    }

    selectedNode = pageNode;

    $nodeTitle.text(pageNode.label);
    $nodeUpdated.text(pageNode.updatedDays + " " + (pageNode.ageDays === 1 ? "day" : "days") + " ago");
    $nodeUpdatedBy.text(pageNode.updatedBy ? pageNode.updatedBy.displayName : "Anon");
    $nodeCreated.text(pageNode.createdDays + " " + (pageNode.ageDays === 1 ? "day" : "days") + " ago");
    $nodeCreatedBy.text(pageNode.createdBy ? pageNode.createdBy.displayName : "Anon");
    return $tooltipTemplate.clone().removeAttr("id").html();
  };

  var popupsEnabled = true;

  UI.popupsEnabled = function(value) {
    if (value !== undefined) {
      popupsEnabled = value && true;
    }
    return popupsEnabled;
  };

  // TOOLTIP CONTROLS

  $("#space-graph")
    .on("click", ".archive-page", function() {
      UI.showMessage("Archive it!", 2000);
    })
    .on("click", ".delete-page", function() {
      UI.popupsEnabled(false);

      var pageToDelete = selectedNode;

      var messageHtml = "Delete ";
      var pageTitle = $('<div/>').text(pageToDelete.label).html(); // TODO this is a nasty way to escape
      messageHtml += "<em>" + pageTitle + "</em>";

      messageHtml += "? "
        +  "<a class='message-confirm-delete'>Confirm</a> or "
        +  "<a class='message-cancel-delete'>cancel</a>";

      $message
        .html(messageHtml)
        .find(".message-confirm-delete").on("click", function() {
          UI.popupsEnabled(true);
          UI.hideMessage();
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
        });

      $message.show();
    })
    .on("click", ".move-page", function() {
      UI.popupsEnabled(false);

      var $cancelLink = $("<a class='message-cancel-move'>cancel</a>");
      $message.text("Select a new parent page or ")
        .append($cancelLink)
        .show();

      var pageToMove = selectedNode;

      GRAPH.setClickHandler(function(selectedNodes) {
        // make sure we've selected something
        if (selectedNodes.length === 0 || selectedNodes[0].id === pageToMove.id) {
          return;
        }

        // don't allow selection of multiple parents - clear the selection
        if (selectedNodes.length > 1) {
          GRAPH.clearSelection();
          return;
        }

        var newParent = selectedNodes[0];

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

        UI.hideMessage();
        UI.popupsEnabled(true);
        GRAPH.clearClickHandler();
        GRAPH.clearSelection();
      });
    }
  );

  // MESSAGE BAR

  var $message = $("#space-graph-message");
  $message.hide(); // start hidden

  UI.showMessage = function(message, timeout) {
    $message.text(message).show();
    if (timeout) {
      setTimeout(UI.hideMessage, timeout);
    }
  };

  UI.hideMessage = function() {
    $message.fadeOut();
  };

  $message.on("click", ".message-cancel-delete", function() {
    UI.hideMessage();
    GRAPH.clearClickHandler();
  });

  $message.on("click", ".message-cancel-move", function() {
    UI.hideMessage();
    GRAPH.clearClickHandler();
  });

})();