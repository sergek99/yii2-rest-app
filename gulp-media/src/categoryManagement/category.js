$(function() {
    var history = new ActionHistory();
    history.onCancel = function (action) {
        switch (action.type) {
            case actionTypes.remove:
                if(action.next != undefined) {
                    $tree.tree('addNodeBefore', action.node, action.next);
                } else {
                    $tree.tree('addNodeAfter', action.node, action.prev);
                }
                $tree.tree('selectNode', null);
                break;
            case actionTypes.move:
                $tree.tree('removeNode', $tree.tree('getNodeById', action.node.id));
                if(action.next || action.prev) {
                    if(action.next != undefined) {
                        $tree.tree('addNodeBefore', action.node, action.next);
                    } else {
                        $tree.tree('addNodeAfter', action.node, action.prev);
                    }
                } else {
                    $tree.tree('appendNode', action.node, action.prevParent);
                }
                $tree.tree('selectNode', null);
                break;
        }
    };

    history.onAdd = function () {
        $('.action__cancel').show();
    };

    var actionTypes = {
        remove: 0,
        cancelRemove: 1,
        move: 2
    };


    var $tree = $('#category-list');

    $tree.tree({
        //data: treeData,
        dragAndDrop: true,
        autoOpen: false,
        onCreateLi: function (node, $li) {
            $li.find('.jqtree-element').append(
                '<div class="row category-item">' +
                '   <div class="col-md-8">' +
                '   </div>' +
                '   <div class="col-md-4">' +
                '       <div class="btn-group">' +
                '           <a class="btn btn-danger btn-sm action__delete">Удалить</a>' +
                '       </div>' +
                '   </div>' +
                '</div>'
            );
            var treeTitle = $li.find('.jqtree-title');
            treeTitle.addClass('category');
            treeTitle.attr('data-id', node.id);
            $li.find('.jqtree-element .col-md-8').append(treeTitle);
        }
    });

    $tree.on('tree.click', function (e) {
        var target = e.click_event.target;
        if ($(target).hasClass('action__delete')) {
            removeCategory($(target));
        }
    });

    $tree.on('tree.move', function(event) {
        var info = event.move_info;
        var historyItem = {
            type: actionTypes.move,
            node: info.moved_node,
            parent: info.moved_node.parent,
            target: info.target_node,
            prevParent: info.previous_parent,
            moveType: info.position
        };

        historyItem.from = (historyItem.parent.id != undefined ? historyItem.parent.id : 0);
        historyItem.to = (historyItem.target.parent.id != undefined ? historyItem.target.parent.id : 0);

        if(historyItem.moveType == 'inside') {
            var sibling = historyItem.node.getNextSibling();
            if(sibling) {
                historyItem.next = sibling;
            } else {
                historyItem.prev = historyItem.node.getPreviousSibling();
            }

            if(historyItem.to == 0) {
                historyItem.to = historyItem.target.id;
            }
        }
        history.add(historyItem);
    });

    $(document).on('DOMNodeInserted', function (e) {
        var target = $(e.target);
        if (target.hasClass('jqtree_common') && target.find('.jqtree-toggler').length) {
            target.find('.col-md-8').prepend(target.find('.jqtree-toggler'));
        }
    });

    function removeCategory(target) {
        var node = $tree.tree('getNodeById', target.closest('.jqtree_common').find('.category').data('id'));
        var historyItem = {
            type: actionTypes.remove,
            id: node.id,
            node: node
        };
        var sibling = node.getNextSibling();
        if(sibling) {
            historyItem.next = sibling;
        } else {
            historyItem.prev = node.getPreviousSibling();
        }
        history.add(historyItem);

        $tree.tree('removeNode', node);
    }

    $('.action__save').on('click', function () {
        var savedData = [];
        var historyData = history.show();
        for (var i in historyData) {
            switch (historyData[i].type) {
                case actionTypes.move:
                    savedData.push({
                        'type': 'move',
                        'from': historyData[i].from,
                        'id': historyData[i].node.id,
                        'to': historyData[i].to
                    });
                    break;
                case actionTypes.remove:
                    savedData.push({
                        'type': 'remove',
                        'id': historyData[i].node.id
                    });
                    break;
            }
        }
        $.ajax({
            'url': '/category/save',
            'type': 'POST',
            'data': {
                _csrf: $('#category-list').data('csrf'),
                data: JSON.stringify(savedData)
            },
            'dataType': 'json',
            'success': function (res) {
                if (res.message == 'success') {
                    alert('Изменения сохранены.');
                    history.clear();
                    $('.action__cancel').hide();
                } else {
                    alert('Ошибка сервера. Изменения не сохранены, попробуйте позже.');
                }
            }
        });
    });

    $('.action__cancel').on('click', function() {
        history.cancel();
    });
});
