rest.directive('1vseEnter', function () {
    return function (scope, element, attrs) {
        element.bind('keydown keypress', function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs['1vseEnter']);
                });
                event.preventDefault();
            }
        });
    }
});