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
    UI.showMessage("Select a new parent page");
  });

})();