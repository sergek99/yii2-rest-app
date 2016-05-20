rest.directive('regionAutocomplete', [
    'rest.AddressesHelper',
    function (regionHelpers) {
        return {
            link: function (scope, element, attrs) {
                element.bind('keydown keypress', function (event) {
                    var filter = {
                        q: element.val()
                    };
                    scope.regionShow = true;
                    regionHelpers.get(filter, function (results) {
                        scope.regionsFullPath = results.regionsFullPath;
                    });
                });
            }
        }
    }
]);