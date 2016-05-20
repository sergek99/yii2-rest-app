rest.directive('brandAutocomplete', [ 'rest.Brands',
    function (brands) {
        return {
            link: function (scope, element, attrs) {
                element.bind('keydown keypress', function (event) {
                    var filter = {
                        q: element.val()
                    };
                    scope.brandShow = true;
                    brands.get(filter, function (results) {
                        scope.brands = results.brands;
                    });
                });
            }
        }
    }
]);