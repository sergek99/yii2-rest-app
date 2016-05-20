rest.controller('rest.controllers.LoginController', [
    '$scope',
    '$rootScope',
    'rest.Auth',
    '$location',
    '$stateParams',
    '$state',
    'rest.LocalStorage',
    function ($scope, $rootScope, auth, $location, $stateParams, $state, localStorage) {
        $scope.errors = null;
        $scope.loginForm = {
            login:'',
            password:''
        };

        $scope.loader = false;

        $scope.submit = function() {
            $scope.loader = true;
            auth.post({form:$scope.loginForm, params:$rootScope.$root.fromState}).$promise.then(function (response) {
                if (response.errors != undefined) {
                    $scope.errors = response.errors;
                } else {
                    var token = response.token;
                    localStorage.set('token', token);
                    $rootScope.auth = true;
                    $rootScope.loginLabel = 'Выход';
                    $rootScope.loginUrl = 'auth/logout';
                    var user = response.user;
                    localStorage.setObject('user',user);
                    if($rootScope.toState != undefined) {
                        if ($rootScope.toState.name == 'auth.login') {
                            $state.go('index');
                        }
                    }
                    if($rootScope.toState == null) {
                        $state.go('index');
                    } else {
                        $state.go($rootScope.toState, $rootScope.toParams);
                    }
                }
            });
        }
    }
]);

rest.controller('rest.controllers.LogoutController', [
    '$scope',
    '$rootScope',
    'rest.Auth',
    '$state',
    'rest.LocalStorage',
    function ($scope, $rootScope, auth, $state, localStorage) {
        localStorage.remove('user');
        localStorage.remove('token');
        auth.get({logout:true}).$promise.then(function (response) {
            if(response.status){
                $rootScope.loginLabel = 'Вход';
                $rootScope.loginUrl = 'auth/login';
            }
            $rootScope.auth = false;
            $state.go('auth.login');
        });
    }
]);