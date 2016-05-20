rest.directive(
    'ngCategoryTree',
    [
        function() {
            return({
                link: function (scope) {
                    scope.categoryChange = function (category) {
                        scope.current = category;
                    };
                    scope.$watch('current', function (val) {
                        if (val != undefined) {
                            scope.changeFn();
                        }
                    });
                },
                scope: {
                    tree: '=tree',
                    changeFn: '&categoryChange',
                    current: '=currentCategory'
                },
                templateUrl: "/views/directives/ng-category-tree.html"
            });
        }
    ]
);