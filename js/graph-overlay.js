(function() {

  window.UI = window.UI || {};

  // MODE SELECT

  $("#mode-select")
    .on("change", function() {
      GRAPH.applyColorMode($(this).val());
    });

  // TOOLTIP

  var selectedNode;

  var $tooltipTemplate = $("#space-graph-tooltip-template");

  var $nodeTitle = $(".node-title");
  var $nodeUpdated = $(".node-updated");
  var $nodeUpdatedBy = $(".node-updated-by");
  var $nodeCreated = $(".node-created");
  var $nodeCreatedBy = $(".node-created-by");
  var $nodeAttachments = $(".node-attachments");
  var $nodeComments = $(".node-comments");
  var $nodeDepth = $(".node-depth");

  function formatDays(days) {
    return days + (days === 1 ? " day" : " days") + " ago";
  }

  function populateUser($a, user) {
    $a.text(user ? user.displayName : "Anonymous");
    $a.attr("href", user ? ALL.hostBaseUrl + "/display/~" + user.name : "#");
  }

  UI.getTooltipHtml = function(pageNode) {
    if (!UI.popupsEnabled()) {
      return undefined;
    }

    selectedNode = pageNode;

    $nodeTitle.text(pageNode.label);
    $nodeUpdated.text(formatDays(pageNode.daysSinceUpdated));
    populateUser($nodeUpdatedBy, pageNode.updatedBy);
    $nodeCreated.text(formatDays(pageNode.daysSinceCreated));
    populateUser($nodeCreatedBy, pageNode.createdBy);
    $nodeAttachments.text(pageNode.attachments);
    $nodeComments.text(pageNode.comments);
    $nodeDepth.text(pageNode.depth);

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
    .on("click", ".view-page", function() {
      window.open(ALL.hostBaseUrl + "/pages/viewpage.action?pageId=" + selectedNode.id);
    })
    .on("click", ".edit-page", function() {
      window.open(ALL.hostBaseUrl + "/pages/editpage.action?pageId=" + selectedNode.id);
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

      UI.showMessage(messageHtml, 0, true);

      $message
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
                UI.showMessage("You can't delete that page.", 2000);
              }
            }
          });
        });
    })
    .on("click", ".move-page", function() {
      UI.popupsEnabled(false);
      UI.showMessage("Select a new parent page or <a class='message-cancel-move'>cancel</a>", 0, true);

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

        if (newParent.id === GRAPH.getSpaceNodeId()) {
          // reparent to space
          AP.request({
            url: "/rpc/json-rpc/confluenceservice-v2/movePageToTopLevel",
            contentType: "application/json",
            type: "POST",
            data: JSON.stringify([pageToMove.id, spaceKey]),
            success: function (response)
            {
              if (JSON.parse(response) === true) {
                console.log("Moved " + pageToMove.id + " to top level.");
                GRAPH.reparent(pageToMove.id, GRAPH.getSpaceNodeId());
              } else {
                console.error("Failed to move " + pageToMove.id + " to top level!");
                UI.showMessage("You can't move that page.", 2000);
              }
            }
          });
        } else {
          // reparent to another page
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
                UI.showMessage("You can't move that page.", 2000);
              }
            }
          });
        }

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

  var timeoutLeft = 0;

  UI.showMessage = function(message, timeout, html) {
    $message[html ? "html" : "text"](message).stop().show();
    if (timeout) {
      timeoutLeft += timeout;
      setTimeout(function() {
        timeoutLeft -= timeout;
        if (timeoutLeft < 1) {
          UI.hideMessage();
        }
      }, timeout);
    }
    $message.css("left", (($(window).width() - $message.width()) / 2) + "px"); // TODO there must be a way to do this with CSS
  };

  UI.hideMessage = function() {
    $message.fadeOut();
  };

  $message.on("click", ".message-cancel-delete", function() {
    UI.hideMessage();
    UI.popupsEnabled(true);
    GRAPH.clearClickHandler();
  });

  $message.on("click", ".message-cancel-move", function() {
    UI.hideMessage();
    UI.popupsEnabled(true);
    GRAPH.clearClickHandler();
  });

})();