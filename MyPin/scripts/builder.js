var dataManager = require("./data-manager");
var helper = require("./helper");
var textItems = dataManager.getTextItems();
var actionItems = dataManager.getActionItems();
var editor = require("./editor");
var aparter = require("./js-action/apart-items");
function createClipboardView() {
  return {
    type: "list",
    props: {
      id: "clipboard-list",
      reorder: true,
      rowHeight: $app.env == $env.today ? 27 : 44,
      separatorColor:
        $app.env == $env.today
          ? $rgba(100, 100, 100, 0.25)
          : $color("separator"),
      data: textItems,
      template: {
        views: [
          {
            type: "label",
            props: {
              id: "label",
              textColor: $color("black"),
              align: $align.left,
              font: $font(12)
            },
            layout: function(make, view) {
              make.right.top.bottom.inset(0);
              make.left.inset(15);
            }
          }
        ]
      },
      actions: [
        {
          title: "delete",
          handler: function(sender, indexPath) {
            if (textItems[indexPath.row] === $clipboard.text) {
//              if ($("input")) {
//                $("input").text = "";
//              }
              $clipboard.clear();
              $("input").text = "轻点输入.."
              $("input").textColor = $color("gray");
            }

            helper.arrayRemove(textItems, indexPath.row);
            saveTextItems();
            reloadTextItems();
          }
        },
        {
          title: $l10n("EDIT"),
          handler: function(sender, indexPath) {
            editor.clipEditor(textItems[indexPath.row]);
            //            $input.text({
            //              text: textItems[indexPath.row]
            //            }).then(function(text) {
            //              if (text.length > 0) {
            //                textItems[indexPath.row] = text;
            //                sender.data = textItems;
            //                saveTextItems();
            //              }
            //            });
          }
        },
        {
          title: "分词",
          color: $color("tint"),
          handler: function(sender, indexPath) {
            reloadTextItems();
            aparter.apart(textItems[indexPath.row]);
          }
        }
      ]
    },
    layout: listViewLayout(),
    events: {
      didSelect: function(sender, indexPath, object) {
        $clipboard.text = $app.env == $env.today ? object.label.text : object;
        $ui.toast($l10n("COPIED"), 0.3);
         $("input").textColor = $color("black");
        if ($app.env == $env.today) $("input").text = $clipboard.text;
        $device.taptic(1);
      },
      reorderMoved: function(fromIndexPath, toIndexPath) {
        helper.arrayMove(textItems, fromIndexPath.row, toIndexPath.row);
      },
      reorderFinished: function() {
        saveTextItems();
      }
    }
  };
}

function saveTextItems() {
  dataManager.setTextItems(textItems);
}

function reloadTextItems() {
  textItems = dataManager.getTextItems();
}

function editAction(action, indexPath) {
  var creator = require("./action-creator");
  creator.edit(action, function(action) {
    actionItems[indexPath.row] = action;
    $("action-list").data = mapActionItems();
    saveActionItems();
  });
}

function saveActionItems() {
  dataManager.setActionItems(actionItems);
}

function reloadActionItems() {
  actionItems = dataManager.getActionItems();
}

function createActionView() {
  return {
    type: "list",
    props: {
      id: "action-list",
      rowHeight: 64,
      reorder: true,
      actions: [
        {
          title: "delete",
          handler: function(sender, indexPath) {
            helper.arrayRemove(actionItems, indexPath.row);
            saveActionItems();
          }
        },
        {
          title: $l10n("LAUNCH"),
          handler: function(sender, indexPath) {
            helper.runAction(actionItems[indexPath.row]);
          }
        },
        {
          title: $l10n("MAKE_ICON"),
          handler: function(sender, indexPath) {
            makeHomeIcon(actionItems[indexPath.row]);
          }
        }
      ],
      template: {
        views: [
          {
            type: "label",
            props: {
              id: "action-name-label"
            },
            layout: function(make, view) {
              make.top.inset(10);
              make.left.inset(15);
            }
          },
          {
            type: "label",
            props: {
              id: "action-pattern-label"
            },
            layout: function(make, view) {
              make.bottom.inset(8);
              make.left.inset(15);
              make.right.inset(72);
            }
          },
          {
            type: "image",
            props: {
              id: "action-icon-image",
              bgcolor: $color("clear")
            },
            layout: function(make, view) {
              make.centerY.equalTo(view.super);
              make.right.inset(15);
              make.size.equalTo($size(24, 24));
            }
          }
        ]
      },
      data: mapActionItems()
    },
    layout: listViewLayout(),
    events: {
      didSelect: function(sender, indexPath) {
        var action = actionItems[indexPath.row];
        editAction(action, indexPath);
      },
      reorderMoved: function(fromIndexPath, toIndexPath) {
        helper.arrayMove(actionItems, fromIndexPath.row, toIndexPath.row);
      },
      reorderFinished: function() {
        saveActionItems();
      }
    }
  };
}

function createActionItem(item) {
  return {
    "action-name-label": {
      "text": item.name
    },
    "action-pattern-label": {
      "text": item.pattern
    },
    "action-icon-image": {
      "icon": $icon(item.icon)
    }
  };
}

function mapActionItems() {
  return actionItems.map(function(item) {
    return createActionItem(item);
  });
}

function listViewLayout() {
  return function(make, view) {
    make.left.right.equalTo(0);
    make.top.inset($app.env == $env.today ? 33 : 44);
    make.bottom.inset($app.env == $env.today ? 33 : 52);
  };
}

function makeHomeIcon(action) {
  var options = [$l10n("USE_DEFAULT_ICON"), $l10n("PHOTO_LIBRARY")];
  $ui.menu(options).then(function(selected) {
    if (selected == null) {
      return;
    }
    if (selected.index == 0) {
      var icon = helper.makeIcon(action.icon, $color("tint"));
      createHomeShortcut(action, icon);
    } else {
      $photo.pick().then(function(result) {
        if (result && result.image) {
          createHomeShortcut(action, result.image);
        }
      });
    }
  });
}

function createHomeShortcut(action, icon) {
  $system.makeIcon({
    title: action.name,
    url: action.pattern.replace("%@", ""),
    icon: icon
  });
}

module.exports = {
  createClipboardView: createClipboardView,
  createActionView: createActionView,
  reloadTextItems: reloadTextItems,
  createActionItem: createActionItem,
  reloadActionItems: reloadActionItems
};
