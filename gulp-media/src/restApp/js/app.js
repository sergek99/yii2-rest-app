'use strict';

var rest = angular.module('rest', ['ui.router', 'ngResource', 'ngCookies', 'ui.sortable', 'ui.bootstrap', 'angularFileUpload', 'ntt.TreeDnD', 'ui.slider', 'ng.autocomplete']);
rest.config([
    '$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $stateProvider
            .state('users', {
                url: "/users?sort&filter&page",
                templateUrl: "/views/users/userList.html",
                controller: "rest.controllers.UserController"
            })
            .state('projects', {
                url: "/projects?sort&filter&page",
                templateUrl: "/views/projects/projectsList.html",
                controller: "rest.controllers.ProjectController"
            })
            .state('tasks', {
                url: '/projects/:id/tasks?filter&page',
                templateUrl: "/views/tasks/taskList.html",
                controller: 'rest.controllers.Tasks'
            })
            .state('index', {
                url: '/'
            })
            .state('auth', {
                url: '/auth',
                abstract: true,
                template: '<ui-view>'
            })
            .state('auth.login', {
                url: '/login',
                templateUrl: "/views/auth/login.html",
                controller: 'rest.controllers.LoginController',
                data: {
                    'noLogin': true,
                    'loginLabel':'Логин',
                    'loginUrl':'auth/login'
                }
            })
            .state('auth.logout', {
                url: '/logout',
                template: '<ui-view>',
                controller: 'rest.controllers.LogoutController'
            })
        ;
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);

        $httpProvider.defaults.headers.common = {
            'Authorization': 'Bearer ' + window.localStorage.getItem('token')
        };
    }
]);

rest.constant('SORT_ASC', 1);
rest.constant('SORT_DESC', 2);

rest.run([
    '$rootScope', '$state', '$stateParams', 'SessionService',
    function ($rootScope, $state, $stateParams, SessionService) {
        $rootScope.loginLabel = 'Вход';
        $rootScope.loginUrl = 'auth/login';
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.user = null;

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                SessionService.checkAccess(event, toState, toParams, fromState, fromParams);
            }
        );
    }
]);