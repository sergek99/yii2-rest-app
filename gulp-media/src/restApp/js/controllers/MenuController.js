rest.controller('rest.controllers.MenuController', [
    '$rootScope',
    '$scope',
    'rest.LocalStorage',
    function ($rootScope, $scope, localStorage) {
        var self = this;
        $scope.menu = {
            users: {
                title: 'Пользователи',
                link: '/users'
            },
            projects: {
                title: 'Проекты',
                link: '/projects'
            },
            auth: {
                title: $rootScope.loginLabel,
                link: $rootScope.loginUrl
            }
        };

        $scope.token = localStorage.get('token');

        if($scope.token != undefined){
            $rootScope.auth = true;
        }

        this.logIn = function(){
            $scope.menu.auth.title = 'Вход';
            $scope.menu.auth.link = '/auth/login';
        };

        this.logOut = function(){
            $scope.menu.auth.title = 'Выход';
            $scope.menu.auth.link = '/auth/logout';
        };

        $scope.$watch(function() {
            if($rootScope.auth) {
                self.logOut();
            } else {
                self.logIn();
            }
        }, function() {
            if($rootScope.auth) {
                self.logOut();
            } else {
                self.logIn();
            }
        }, true);
    }
]);