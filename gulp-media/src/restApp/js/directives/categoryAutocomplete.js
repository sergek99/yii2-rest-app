rest.directive(
    'categoryAutocomplete',
    [
        'rest.Category', '$timeout',
        function(category, $timeout) {
            return({
                link: link,
                templateUrl: "/views/directives/category-autocomplete.html"
            });
            function link( scope, element, attributes ) {
                scope.categoryShow = false;
                scope.treeShow = false;
                var input = element.find('#category-autocomplete');
                input.bind('keydown keypress', function (event) {
                    var filter = {
                        q: input.val()
                    };
                    $timeout(function(){
                        category.get(filter, function (results) {
                            if(results.categories.length == 0){
                                if(!scope.treeShow){
                                    scope.treeShow = true;
                                }
                                if(scope.categoryShow) {
                                    scope.categoryShow = false;
                                }
                            } else {
                                if(scope.treeShow) {
                                    scope.treeShow = false;
                                }
                                if(!scope.categoryShow) {
                                    scope.categoryShow = true;
                                }
                            }
                            scope.categoriesAuto = results.categories;
                        });
                    }, 500);
                });

                input.bind('keyup', function (event) {
                    if(input.val() == ''){
                        if(!scope.treeShow){
                            scope.treeShow = true;
                        }
                        if(scope.categoryShow) {
                            scope.categoryShow = false;
                        }
                    } else {
                        if(scope.treeShow) {
                            scope.treeShow = false;
                        }
                        if(!scope.categoryShow) {
                            scope.categoryShow = true;
                        }
                    }
                });

                scope.inputClick = function() {

                }
            }
        }
    ]
);