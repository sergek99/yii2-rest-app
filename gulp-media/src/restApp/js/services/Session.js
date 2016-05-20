rest.service('SessionService', [
    '$injector',
    'rest.Auth',
    '$cookies',
    '$state',
    function($injector, auth, $cookies, $state) {
        "use strict";
        this.checkAccess = function(event, toState, toParams, fromState, fromParams) {
            var $scope = $injector.get('$rootScope');
            
            if(toState.name != 'auth.login') {
                $scope.toState = toState;
                $scope.toParams = toParams;
            }
            $scope.$root.fromState = fromState;
            if (toState.data !== undefined) {
                if (toState.data.noLogin !== undefined && toState.data.noLogin) {

                }
            } else {
                if (window.localStorage.getItem('user')) {
                    try {
                        $scope.$root.user = angular.fromJson(window.localStorage.getItem('user'));
                        if($scope.$root.user.id == undefined){
                            event.preventDefault();
                            window.localStorage.removeItem('user');
                            $scope.$state.go('auth.login');
                            return;
                        }
                    } catch (e) {
                        event.preventDefault();
                        window.localStorage.removeItem('user');
                        $scope.$state.go('auth.login');
                        return;
                    }
                    var url = $state.href(toState.name, {}, {absolute: false});
                    auth.get({id:$scope.$root.user.id, url:url}).$promise.then(function (response) {
                        if (!response.status) {
                            event.preventDefault();
                            window.localStorage.removeItem('user');
                            $scope.$state.go('auth.login');
                        } else {
                            $scope.loginLabel = 'Выход';
                            $scope.loginUrl = 'auth/logout';
                        }
                    });
                } else {
                    event.preventDefault();
                    $scope.$state.go('auth.login');
                }
            }
        };
    }
]);