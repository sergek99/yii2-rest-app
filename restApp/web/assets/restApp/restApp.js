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
rest.controller('rest.controllers.BannersController', [
    '$scope',
    '$http',
    'rest.Banners',
    '$location',
    '$stateParams',
    '$state',
    '$uibModal',
    'rest.LocalStorage',
    function ($scope, $http, banners, $location, $stateParams, $state, $uibModal, localStorage) {
        var self = this;
        var queryParams = {};
        var perPage = 20;
        $scope.banners = null;
        $scope.currentPage = null;
        $scope.showError = false;
        $scope.errorMessage = null;

        $scope.token = localStorage.get('token');

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        this.syncParams = function () {
            queryParams = angular.copy($stateParams);
            angular.forEach(queryParams.filter, function (filter) {
                var value = filter.substr(filter.indexOf(':') + 1);
                var name = filter.substr(0, filter.indexOf(':'));
                queryParams["filter[" + name + "]"] = value;
                $scope.filter[name] = value;
                delete queryParams.filter;
            });
        };

        $scope.filter = {
            name: "",
            email: ""
        };

        $scope.pageChanged = function () {
            $stateParams.page = $scope.currentPage;
            $state.go($state.current, $stateParams, {reload: true});
        };

        self.syncParams();

        this.getBanners = function() {
            banners.get(queryParams).$promise.then(function (response) {
                $scope.banners = response.banners;
                $scope.pagination = response.pagination;
                $scope.currentPage = $stateParams.page != undefined ? $stateParams.page : 1;
            });
        };

        self.getBanners();

        $scope.getStatus = function (status) {
            switch (status) {
                case 0:
                    return 'UNPUBLISHED';
                case 1:
                    return 'PUBLISHED';
            }
        };

        $scope.getPlace = function (place) {
            switch (place) {
                case 1:
                    return 'LEFT';
                case 2:
                    return 'RIGHT';
                case 3:
                    return 'TOP';
                case 4:
                    return 'BOTTOM';
                case 5:
                    return 'CENTER';
            }
        };

        $scope.deleteBanner = function (banner) {
            banners.delete({bannerId:banner.id}).$promise.then(function (response) {
                self.getBanners();
            });
        };

        $scope.bannerEnable = function (banner) {
            banners.update({bannerId: banner.id, banner: banner, status:banner.status}).$promise.then(function (response) {
                if (response.errors != undefined) {
                    $scope.errors = response.errors;
                    $scope.showError = true;
                    $scope.errorMessage = $scope.errors.file;
                } else {
                    banner.status = 1;
                }
            });
        };

        $scope.bannerDisable = function (banner) {
            banners.update({bannerId: banner.id, banner: banner, status:banner.status}).$promise.then(function (response) {
                banner.status = 0;
            });
        };

        $scope.bannerAdd = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'bannerCreate',
                controller: 'rest.controllers.BannerAddModal'
            });

            modalInstance.result.then(function (banner) {
                banner.place = parseInt(banner.place);
                $scope.banners.push(banner);
            });
        };

        $scope.bannerEdit = function () {
            var self = this;

            var modalInstance = $uibModal.open({
                templateUrl: 'bannerEdit',
                controller: 'rest.controllers.BannerEditModal',
                resolve: {
                    banner: function() {
                        return self.banner;
                    }
                }
            });

            modalInstance.result.then(function (banner) {
                self.banner = banner;
                self.banner.place = parseInt(banner.place);
                $state.go($state.current, $stateParams, {notify: false, reload: true});
            });
        };

        $scope.empty = function (obj) {
            if(Object.keys(obj).length){
                return false;
            } else {
                return true;
            }
        };
    }
]);

rest.controller('rest.controllers.BannerAddModal', [
    '$scope',
    '$uibModalInstance',
    'rest.Banners',
    'FileUploader',
    'rest.LocalStorage',
    '$http',
    function ($scope, $uibModalInstance, banners, FileUploader, localStorage, $http) {
        $scope.banner = {
            'title':null,
            'url':null,
            'place':null,
            'status':0,
            'weight':0,
            'file':null,
            'info':[]
        };
        $scope.places = [
            {'id':'1', 'value': 'LEFT'},
            {'id':'2', 'value': 'RIGHT'},
            {'id':'3', 'value': 'TOP'},
            {'id':'4', 'value': 'BOTTOM'},
            {'id':'5', 'value': 'CENTER'}
        ];

        $scope.token = localStorage.get('token');

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        $scope.getPlace = function (place) {
            switch (place) {
                case 1:
                    return 'LEFT';
                case 2:
                    return 'RIGHT';
                case 3:
                    return 'TOP';
                case 4:
                    return 'BOTTOM';
                case 5:
                    return 'CENTER';
            }
        };

        var uploader = $scope.uploader = new FileUploader({
            url: '/rest/banners',
            method: 'POST',
            headers: {
                'Content-Type': 'rest/request-with-file'
            }
        });

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item, options) {
                return this.queue.length < 10;
            }
        });

        var controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        uploader.onBeforeUploadItem = function(item) {
            item.formData.push({
                banner: angular.toJson($scope.banner)
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.close($scope.banner);
        };

        $scope.save = function (banner) {
            if(uploader.queue.length>0) {
                uploader.uploadAll();
            } else {
                banners.create({banner:banner}).$promise.then(function (response) {
                    if (response.errors != undefined) {
                        $scope.errors = response.errors;
                    } else {
                        $uibModalInstance.close(response.banner);
                    }
                });
            }
        };

        uploader.onCompleteItem = function(item, response, status, headers) {
            $uibModalInstance.close(response.banner);
        };
    }
]);

rest.controller('rest.controllers.BannerEditModal', [
    '$scope',
    '$uibModalInstance',
    'banner',
    'rest.Banners',
    'FileUploader',
    'rest.LocalStorage',
    '$http',
    function ($scope, $uibModalInstance, banner, banners, FileUploader, localStorage, $http) {
        $scope.banner = angular.copy(banner);
        $scope.places = [
            {'id':'1', 'value': 'LEFT'},
            {'id':'2', 'value': 'RIGHT'},
            {'id':'3', 'value': 'TOP'},
            {'id':'4', 'value': 'BOTTOM'},
            {'id':'5', 'value': 'CENTER'}
        ];
        $scope.banner.place = $scope.banner.place.toString()

        $scope.token = localStorage.get('token');

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        $scope.getPlace = function (place) {
            switch (place) {
                case 1:
                    return 'LEFT';
                case 2:
                    return 'RIGHT';
                case 3:
                    return 'TOP';
                case 4:
                    return 'BOTTOM';
                case 5:
                    return 'CENTER';
            }
        };

        var uploader = $scope.uploader = new FileUploader({
            url: '/rest/banners/' + banner.id,
            method: 'PUT',
            headers: {
                'Content-Type': 'rest/request-with-file'
            }
        });

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item, options) {
                return this.queue.length < 10;
            }
        });

        var controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        uploader.onBeforeUploadItem = function(item) {
            item.formData.push({
                banner: angular.toJson($scope.banner)
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.close($scope.banner);
        };

        $scope.save = function (banner) {
            if(uploader.queue.length>0) {
                uploader.uploadAll();
            } else {
                banners.update({bannerId:banner.id, banner:banner}).$promise.then(function (response) {
                    if (response.errors != undefined) {
                        $scope.errors = response.errors;
                    } else {
                        $uibModalInstance.close(response.banner);
                    }
                });
            }
        };

        uploader.onCompleteItem = function(item, response, status, headers) {
            if (response.errors != undefined) {
                $scope.errors = response.errors;
            } else {
                $uibModalInstance.close(response.banner);
            }
        };
    }
]);
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
rest.controller('rest.controllers.ProjectController', [
    '$scope',
    'rest.Projects',
    '$location',
    '$stateParams',
    'SORT_ASC',
    'SORT_DESC',
    '$state',
    '$uibModal',
    'rest.Auth',
    'rest.LocalStorage',
    '$http',
    function ($scope, $project, $location, $stateParams, SORT_ASC, SORT_DESC, $state, $uibModal, auth, localStorage, $http) {
        var self = this;
        var queryParams = {};
        var perPage = 20;
        $scope.projects = null;
        $scope.token = localStorage.get('token');

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        $project.get(queryParams).$promise.then(function (response) {
            $scope.projects = response.projects;
            $scope.pagination = response.pagination;
            $scope.currentPage = $stateParams.page != undefined ? $stateParams.page : 1;
        });

        $scope.pageChanged = function () {
            $stateParams.page = $scope.currentPage;
            $state.go($state.current, $stateParams, {reload: true});
        };

        $scope.newProjectClick = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'newProject',
                controller: 'rest.controllers.NewProject'
            });

            modalInstance.result.then(function (project) {
                if(project) {
                    $scope.projects.push(project);
                }
            });
        };

        $scope.statusName = function (status) {
            switch (status) {
                case 0:
                    return 'Создан';
                case 1:
                    return 'В работе';
                case 2:
                    return 'Завершен';
            }
        };

        $scope.projectRemove = function(id, index) {
            console.log($scope.projects[index]);
            $project.delete({projectId:$scope.projects[index].id}).$promise.then(function (response) {
                $scope.projects.splice(index, 1);
            });
        };

        $scope.projectEdit = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'editProject',
                controller: 'rest.controllers.EditProject',
                resolve: {
                    project: function() {
                        return self.project;
                    }
                }
            });

            modalInstance.result.then(function (project) {
                if(project) {
                    self.project = project
                }
            });
        };


    }
]);

rest.controller('rest.controllers.EditProject', [
    '$scope',
    '$uibModalInstance',
    'project',
    'rest.UsersService',
    'rest.Projects',
    function ($scope, $uibModalInstance, project, $users, $project) {
        $scope.project = angular.copy(project);
        $scope.users = [];

        var temp = project.date_start.split('.');
        $scope.dateStart = new Date(temp[1]+'.'+temp[0]+'.'+temp[2]);
        temp = project.date_end.split('.');
        $scope.dateEnd =  new Date(temp[1]+'.'+temp[0]+'.'+temp[2]);

        $users.resource.get({all:true}).$promise.then(function (response) {
            var users = response.users;
            angular.forEach(users, function(item){
                item.id = parseInt(item.id);

            }, users);
            $scope.users = users;
        });

        $scope.getUserName = function (user) {
            return user.lastname + ' ' + user.firstname;
        };

        /* start datetimepickers */

        $scope.format = 'dd.MM.yyyy';

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.open1 = function() { $scope.popup1.opened = true; delete $scope.errors['date_start'] };
        $scope.popup1 = { opened: false };
        $scope.open2 = function() { $scope.popup2.opened = true; delete $scope.errors['date_end'] };
        $scope.popup2 = { opened: false };

        $scope.$watch('dateEnd',function(){
            $scope.project.date_end = formatDate($scope.dateEnd);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_end'] = ['Дата завершения задачи не может быть меньше чем дата начала'];
            }
        });

        $scope.$watch('dateStart',function(){
            $scope.project.date_start = formatDate($scope.dateStart);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_start'] = ['Дата начала задачи не может быть больше чем дата завершения'];
            }
        });

        function formatDate(date){
            var options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            };
            return date.toLocaleString("ru", options);
        }

        $scope.cancel = function () {
            $uibModalInstance.close(project);
        };

        $scope.save = function () {
            $project.update({projectId: $scope.project.id, project: $scope.project}).$promise.then(function (response) {
                if (response.errors != undefined) {
                    $scope.project.errors = response.errors;
                } else {
                    $uibModalInstance.close($scope.project);
                }
            });
        };
    }
]);

rest.controller('rest.controllers.NewProject', [
    '$scope',
    '$uibModalInstance',
    'rest.Projects',
    'rest.UsersService',
    function ($scope, $uibModalInstance, $project, $users) {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        $scope.dateStart = new Date();
        $scope.dateEnd = tomorrow;

        $scope.errors = {};
        $scope.project = {
            name:null,
            description:null,
            date_start:null,
            date_end:null
        };

        $users.resource.get({all:true}).$promise.then(function (response) {
            $scope.users = response.users;
        });

        /* start datetimepickers */

        $scope.format = 'dd.MM.yyyy';

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.open1 = function() { $scope.popup1.opened = true; delete $scope.errors['date_start'] };
        $scope.popup1 = { opened: false };
        $scope.open2 = function() { $scope.popup2.opened = true; delete $scope.errors['date_end'] };
        $scope.popup2 = { opened: false };

        $scope.$watch('dateEnd',function(){
            $scope.project.date_end = formatDate($scope.dateEnd);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_end'] = ['Дата завершения проекта не может быть меньше чем дата начала'];
            }
        });

        $scope.$watch('dateStart',function(){
            $scope.project.date_start = formatDate($scope.dateStart);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_start'] = ['Дата начала проекта не может быть больше чем дата завершения'];
            }
        });

        function formatDate(date){
            var options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            };
            return date.toLocaleString("ru", options);
        }

        /* end datetimepickers */

        $scope.getUserName = function (user) {
            return user.lastname + ' ' + user.firstname;
        };

        $scope.cancel = function () {
            $uibModalInstance.close(null);
        };

        $scope.save = function () {
            $project.create({project:$scope.project}).$promise.then(function (response) {
                console.log('response', response);
                if (response.errors != undefined) {
                    $scope.errors = response.errors;
                }
                if(response.success){
                    $uibModalInstance.close($scope.project);
                }
            });
        };
    }
]);

rest.controller('rest.controllers.Tasks', [
    '$scope',
    'rest.Tasks',
    '$location',
    '$stateParams',
    '$state',
    '$uibModal',
    'rest.Auth',
    'rest.LocalStorage',
    '$http',
    function ($scope, $task, $location, $stateParams, $state, $uibModal, auth, localStorage, $http) {
        var self = this;
        var queryParams = {};
        $scope.tasks = null;
        $scope.token = localStorage.get('token');
        queryParams["filter[projectId]"] = $stateParams.id;

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        $task.get(queryParams).$promise.then(function (response) {
            $scope.tasks = response.tasks;
            $scope.pagination = response.pagination;
            $scope.currentPage = $stateParams.page != undefined ? $stateParams.page : 1;
        });

        $scope.newTask = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'newTask',
                controller: 'rest.controllers.NewTask',
                resolve: {
                    project: function() {
                        return $stateParams.id;
                    }
                }
            });

            modalInstance.result.then(function (task) {
                $scope.tasks.push(task);
            });
        };

        $scope.statusName = function (status) {
            switch (status) {
                case 0:
                    return 'Создана';
                case 1:
                    return 'В работе';
                case 2:
                    return 'Завершена';
            }
        };

        $scope.getUserName = function (user) {
            return user['lastname'] + ' ' + user['firstname'];
        };

        $scope.taskRemove = function(index) {
            $task.delete({taskId:$scope.tasks[index].id}).$promise.then(function (response) {
                $scope.tasks.splice(index, 1);
            });
        };

        $scope.taskEdit = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'editTask',
                controller: 'rest.controllers.TaskEdit',
                resolve: {
                    task: function() {
                        return self.task;
                    }
                }
            });

            modalInstance.result.then(function (task) {
                self.task = task;
            });
        };

        $scope.taskHistory = function(id){
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'historyTask',
                controller: 'rest.controllers.TaskHistory',
                resolve: {
                    task: function() {
                        return self.task;
                    }
                }
            });

            modalInstance.result.then(function () {

            });

        }
    }
]);

rest.controller('rest.controllers.NewTask', [
    '$scope',
    '$uibModalInstance',
    'project',
    'rest.Tasks',
    'rest.UsersService',
    function ($scope, $uibModalInstance, projectId, $task, $users) {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + Math.random(10));
        $scope.dateStart = new Date();
        $scope.dateEnd = tomorrow;

        $scope.errors = {};
        $scope.task = {
            name:null,
            description:null,
            user_id:null,
            status: 0,
            project_id: projectId,
            date_start:null,
            date_end:null
        };
        $scope.statuses = [
            {
                id: 0,
                title: 'Назначена'
            },
            {
                id: 1,
                title: 'В работе'
            },
            {
                id: 2,
                title: 'Тестирование'
            },
            {
                id: 3,
                title: 'Завершена'
            },
            {
                id: 4,
                title: 'Отклонена'
            }
        ];

        $users.resource.get({all:true}).$promise.then(function (response) {
            $scope.users = response.users;
        });

        /* start datetimepickers */

        $scope.format = 'dd.MM.yyyy';

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.open1 = function() { $scope.popup1.opened = true; delete $scope.errors['date_start'] };
        $scope.popup1 = { opened: false };
        $scope.open2 = function() { $scope.popup2.opened = true; delete $scope.errors['date_end'] };
        $scope.popup2 = { opened: false };

        $scope.$watch('dateEnd',function(){
            $scope.task.date_end = formatDate($scope.dateEnd);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_end'] = ['Дата завершения задачи не может быть меньше чем дата начала'];
            }
        });

        $scope.$watch('dateStart',function(){
            $scope.task.date_start = formatDate($scope.dateStart);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_start'] = ['Дата начала задачи не может быть больше чем дата завершения'];
            }
        });

        function formatDate(date){
            var options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            };
            return date.toLocaleString("ru", options);
        }

        /* end datetimepickers */

        $scope.getUserName = function (user) {
            return user.lastname + ' ' + user.firstname;
        };

        $scope.cancel = function () {
            $uibModalInstance.close(null);
        };

        $scope.save = function () {
            console.log($scope.task);
            $task.create({task:$scope.task}).$promise.then(function (response) {
                console.log('response', response);
                if (response.errors != undefined) {
                    $scope.errors = response.errors;
                }
                if(response.success){
                    $uibModalInstance.close(response.task);
                }
            });
        };
    }
]);

rest.controller('rest.controllers.TaskEdit', [
    '$scope',
    '$uibModalInstance',
    'task',
    'rest.Tasks',
    'rest.UsersService',
    function ($scope, $uibModalInstance, task, $task, $users) {
        $scope.newUser = false;
        $scope.history = {
            new_user:null,
            comment:null
        };
        $scope.task = angular.copy(task);
        var temp = task.date_start.split('.');
        $scope.dateStart = new Date(temp[1]+'.'+temp[0]+'.'+temp[2]);
        temp = task.date_end.split('.');
        $scope.dateEnd =  new Date(temp[1]+'.'+temp[0]+'.'+temp[2]);

        $scope.errors = {};

        $scope.statuses = [
            {
                id: "0",
                title: 'Назначена'
            },
            {
                id: "1",
                title: 'В работе'
            },
            {
                id: "2",
                title: 'Тестирование'
            },
            {
                id: "3",
                title: 'Завершена'
            },
            {
                id: "4",
                title: 'Отклонена'
            }
        ];

        $users.resource.get({all:true}).$promise.then(function (response) {
            $scope.users = response.users;
        });

        /* start datetimepickers */

        $scope.format = 'dd.MM.yyyy';

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.open1 = function() { $scope.popup1.opened = true; delete $scope.errors['date_start'] };
        $scope.popup1 = { opened: false };
        $scope.open2 = function() { $scope.popup2.opened = true; delete $scope.errors['date_end'] };
        $scope.popup2 = { opened: false };

        $scope.$watch('dateEnd',function(){
            $scope.task.date_end = formatDate($scope.dateEnd);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_end'] = ['Дата завершения задачи не может быть меньше чем дата начала'];
            }
        });

        $scope.$watch('dateStart',function(){
            $scope.task.date_start = formatDate($scope.dateStart);
            var date_start, date_end;
            date_start = $scope.dateStart.getTime();
            date_end = $scope.dateEnd.getTime();
            if(date_start > date_end){
                $scope.errors['date_start'] = ['Дата начала задачи не может быть больше чем дата завершения'];
            }
        });

        function formatDate(date){
            var options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            };
            return date.toLocaleString("ru", options);
        }

        /* end datetimepickers */

        $scope.getUserName = function (user) {
            return user.lastname + ' ' + user.firstname;
        };

        $scope.cancel = function () {
            $uibModalInstance.close(null);
        };

        $scope.changeUser = function(){
            console.log($scope.history);
        };

        $scope.addNewUser = function() {
            $scope.newUser = true;
        };
        $scope.newUserCancel = function() {
            $scope.newUser = false;
        };

        $scope.newUserSave = function(){
            angular.forEach($scope.users, function(item){
                if(item.id == $scope.history.new_user){
                    $scope.task.user_id = item.id;
                    $scope.task.user = item;
                    $scope.task['comment'] = $scope.history.comment;
                    $scope.newUser = false;
                    console.log($scope.task);
                }
            })
        };

        $scope.save = function () {
            $task.update({taskId:$scope.task.id ,task:$scope.task}).$promise.then(function (response) {
                console.log('response', response);
                if (response.errors != undefined) {
                    $scope.errors = response.errors;
                }
                if(response.success){
                    $uibModalInstance.close($scope.task);
                }
            });
        };
    }
]);

rest.controller('rest.controllers.TaskHistory', [
    '$scope',
    '$uibModalInstance',
    'task',
    'rest.Tasks',
    function ($scope, $uibModalInstance, task, $task) {
        $scope.task = angular.copy(task);

        var queryParams = {};
        queryParams["filter[history]"] = $scope.task.id;
        $task.get(queryParams).$promise.then(function (response) {
            $scope.history = response.history
        });

        $scope.getUserName = function (user) {
            return user['lastname'] + ' ' + user['firstname'];
        };

        $scope.cancel = function () {
            $uibModalInstance.close(null);
        };


    }
]);
rest.controller('rest.controllers.UserController', [
    '$scope',
    'rest.UsersService',
    '$location',
    '$stateParams',
    'SORT_ASC',
    'SORT_DESC',
    '$state',
    '$uibModal',
    'rest.Auth',
    'rest.LocalStorage',
    '$http',
    function ($scope, $users, $location, $stateParams, SORT_ASC, SORT_DESC, $state, $uibModal, auth, localStorage, $http) {
        var self = this;
        var queryParams = {};
        var perPage = 20;

        $scope.token = localStorage.get('token');

        if($scope.token) {
            $http.defaults.headers.common["Authorization"] = 'Bearer '+$scope.token;
        } else {
            $state.go('auth.login');
        }

        this.syncParams = function () {
            queryParams = angular.copy($stateParams);
            angular.forEach(queryParams.filter, function (filter) {
                var value = filter.substr(filter.indexOf(':') + 1);
                var name = filter.substr(0, filter.indexOf(':'));
                queryParams["filter[" + name + "]"] = value;
                $scope.filter[name] = value;
                delete queryParams.filter;
            });
        };

        $scope.filter = {
            name: "",
            email: ""
        };

        $scope.pageChanged = function () {
            $stateParams.page = $scope.currentPage;
            $state.go($state.current, $stateParams, {reload: true});
        };
        self.syncParams();
        $users.resource.get(queryParams).$promise.then(function (response) {
            $scope.users = response.users;
            $scope.pagination = response.pagination;
            $scope.currentPage = $stateParams.page != undefined ? $stateParams.page : 1;
        });

        $scope.userRemove = function (index) {
            $users.resource.remove({userId: this.user.id});
            $scope.users.splice(index, 1);
            var page = $scope.currentPage * perPage + 1;

            $users.resource.get(angular.extend(queryParams, {'per-page': 1, 'page': page}))
                .$promise.then(function(response) {
                    $scope.users.push(response.users[0]);
                });
        };

        $scope.sort = function () {
            $stateParams.sort = self.getSortOrder() == SORT_ASC ? 'name' : '-name';
            $state.go($state.current, $stateParams, {notify: false, reload: false});

            self.syncParams();

            $users.resource.get(queryParams).$promise.then(
                function (response) {
                    $scope.users = response.users;
                }
            );
        };

        $scope.getSortClass = function () {
            return self.getSortOrder() == SORT_ASC ? 'glyphicon-sort-by-attributes-alt' : 'glyphicon-sort-by-attributes';
        };

        $scope.applyFilter = function () {
            $stateParams.filter = [
                'name:' + $scope.filter['name'],
                'email:' + $scope.filter['email']
            ];
            $state.go($state.current, $stateParams, {notify: false, reload: false});
            self.syncParams();
            $users.resource.get(queryParams).$promise.then(function (response) {
                $scope.users = response.users;
                $scope.pagination = response.pagination;
                $scope.currentPage = $stateParams.page != undefined ? $stateParams.page : 1;
            });
        };

        $scope.userInfo = function() {
            var user = this.user;
            var modalInstance = $uibModal.open({
                templateUrl: 'userInfo',
                controller: 'rest.controllers.UserInfoModal',
                resolve: {
                    user: function() {
                        return user;
                    }
                }
            });


        };

        $scope.userEdit = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'userEdit',
                controller: 'rest.controllers.UserEditModal',
                resolve: {
                    user: function() {
                        return self.user;
                    },
                    token: function() {
                        return $scope.token;
                    }
                }
            });

            modalInstance.result.then(function (user) {
                self.user = user;
            });
        };

        $scope.newUser = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'userNew',
                controller: 'rest.controllers.UserNewModal',
                resolve: {
                    token: function() {
                        return $scope.token;
                    }
                }
            });
            modalInstance.result.then(function (user) {
                $scope.users.push(user);
            });
        };

        $scope.statusName = function (status) {
            switch (status) {
                case 0:
                    return 'Неактивен';
                case 1:
                    return 'Активен';
                case 2:
                    return 'БОТ';
            }
        };

        $scope.editUserRole = function () {
            var self = this;
            var modalInstance = $uibModal.open({
                templateUrl: 'userRoleEdit',
                controller: 'rest.controllers.UserEditRoleModal',
                resolve: {
                    user: function () {
                        return self.user;
                    }
                }
            });

            modalInstance.result.then(function (user) {
                self.user = user;
            });
        };

        this.getSortOrder = function () {
            var sortOrder = SORT_ASC;
            if ($stateParams.sort != undefined && $stateParams.sort.indexOf('-') !== 0) {
                sortOrder = SORT_DESC;
            }
            return sortOrder;
        };

        $scope.adminAuth = function(user){
            auth.post({id:user.id, user:user}).$promise.then(function (response) {
                if(response.hash){
                    var hash = response.hash;
                    var url = response.url;
                    var win = window.open(url+hash, '_blank');
                    win.focus();
                }
            });
        }
    }
]);

rest.controller('rest.controllers.UserInfoModal', [
    '$scope',
    '$uibModalInstance',
    'user',
    function ($scope, $uibModalInstance, user) {
        $scope.user = user;

        $scope.ok = function () {
            $uibModalInstance.close();
        }
    }
]);

rest.controller('rest.controllers.UserEditModal', [
    '$scope',
    '$uibModalInstance',
    'user',
    'token',
    'rest.UsersService',
    'FileUploader',
    'rest.LocalStorage',
    function ($scope, $uibModalInstance, user, token, $users, FileUploader, localStorage) {
        $scope.user = angular.copy(user);

        $scope.token = localStorage.get('token');
        console.log(token);

        var uploader = null;
        var controller = null;

        uploader = $scope.uploader = new FileUploader({
            url: '/rest/users/' + $scope.user.id,
            method: 'PUT',
            headers: {
                'Content-Type': 'rest/request-with-file',
                'Authorization': 'Bearer '+$scope.token
            }
        });

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item, options) {
                this.queue = [];
                return this.queue.length < 1;
            }
        });

        controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        uploader.onBeforeUploadItem = function(item) {
            item.formData.push({
                user: angular.toJson($scope.user)
            });
        };

        uploader.onCompleteItem = function(item, response, status, headers) {
            if (response.errors != undefined) {
                $scope.errors = response.errors;
            }
        };

        uploader.onError = function(response, status, headers) {
            item.isUploaded = false;
        };

        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            if(response.success){
                $scope.user.avatar = response.avatar;
                $uibModalInstance.close($scope.user);
            }
            if(response.errors){
                angular.forEach(uploader.queue, function(item) {
                    item.isUploaded = false;
                });
                $scope.errors = response.errors;
            }
        };


        $scope.cancel = function () {
            $uibModalInstance.close(user);
        };

        $scope.save = function () {
            $scope.errors = null;

            if(uploader.queue.length>0) {
                uploader.formData = $scope.user;
                uploader.uploadAll();
            } else {
                $users.resource.edit($scope.user).$promise.then(function (response) {
                    if (response.errors != undefined) {
                        $scope.user.errors = response.errors;
                    } else {
                        $uibModalInstance.close($scope.user);
                    }
                });
            }
        };
    }
]);

rest.controller('rest.controllers.UserNewModal', [
    '$scope',
    '$uibModalInstance',
    'token',
    'rest.UsersService',
    'FileUploader',
    'rest.LocalStorage',
    function ($scope, $uibModalInstance, token, $users, FileUploader, localStorage) {
        $scope.user = {};

        $scope.token = localStorage.get('token');
        console.log(token);

        var uploader = null;
        var controller = null;

        uploader = $scope.uploader = new FileUploader({
            url: '/rest/users',
            method: 'POST',
            headers: {
                'Content-Type': 'rest/request-with-file',
                'Authorization': 'Bearer '+$scope.token
            }
        });

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item, options) {
                this.queue = [];
                return this.queue.length < 1;
            }
        });

        controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        uploader.onBeforeUploadItem = function(item) {
            item.formData.push({
                user: angular.toJson($scope.user)
            });
        };

        uploader.onCompleteItem = function(item, response, status, headers) {
            if (response.errors != undefined) {
                $scope.errors = response.errors;
            }
        };

        uploader.onError = function(response, status, headers) {
            item.isUploaded = false;
        };

        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            if(response.success){
                $scope.user.avatar = response.user.avatar;
                $uibModalInstance.close(response.user);
            }
            if(response.errors){
                angular.forEach(uploader.queue, function(item) {
                    item.isUploaded = false;
                });
                $scope.errors = response.errors;
            }
        };

        $scope.cancel = function () {
            $uibModalInstance.close(user);
        };

        $scope.save = function () {
            $scope.errors = null;

            if(uploader.queue.length>0) {
                uploader.formData = $scope.user;
                uploader.uploadAll();
            } else {
                $users.resource.create($scope.user).$promise.then(function (response) {
                    if (response.errors != undefined) {
                        $scope.user.errors = response.errors;
                    } else {
                        $uibModalInstance.close(response.user);
                    }
                });
            }
        };
    }
]);
rest.factory("rest.Auth", [
    '$resource',
    function($resource) {
        return $resource('/auth/:id', {id:'@id'}, {
            get: { method: "GET" },
            post: { method: "POST" }
        });
    }
]);
rest.factory("rest.LocalStorage", [
    function() {
        return {
            set: function(key, value) {
                window.localStorage.setItem(key, value);
            },
            get: function(key) {
                return window.localStorage.getItem(key);
            },
            setObject: function(key, value) {
                window.localStorage.setItem(key, JSON.stringify(value));
            },
            getObject: function(key) {
                return JSON.parse(window.localStorage.getItem(key));
            },
            remove: function(key) {
                window.localStorage.removeItem(key);
            }
        }
    }
]);
rest.factory("rest.Projects",
    ["$resource", function($resource) {
        return $resource('/rest/projects/:projectId', { projectId: '@projectId' }, {
            get: { method: "GET" },
            create: { method: "POST" },
            update: { method: "PUT" },
            delete: { method: "DELETE" }
        });
    }]
);
rest.factory("rest.Tasks",
    ["$resource", function($resource) {
        return $resource('/rest/tasks/:taskId', { taskId: '@taskId' }, {
            get: { method: "GET" },
            create: { method: "POST" },
            update: { method: "PUT" },
            delete: { method: "DELETE" }
        });
    }]
);
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
rest.service('rest.UsersService', [
    '$resource',
    function ($resource) {
        this.resource = $resource('/rest/users/:userId', { userId: '@id'}, {
            'edit': {method: 'PUT'},
            'create': {method: 'POST'}
        });
    }
]);

angular.module('ng.autocomplete', [] )
    .directive('ngAutocomplete', ["$parse", "$http", "$sce", "$timeout", "$rootScope", function ($parse, $http, $sce, $timeout, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            id : "@id",
            placeholder : "@placeholder",
            selectedObject : "=selectedobject",
            url : "@url",
            dataField : "@datafield",
            titleField : "@titlefield",
            localData : "@localdata",
            searchFields : "@searchfields",
            minLengthUser : "@minlength",
            matchClass : "@matchclass",
            userParams : "=userparams",
            selectedItem : "=",
            aClick : '&'
        },
        replace: true,
        template: ''+
            '<div class="angucomplete-holder">'+
                '<input id="{{id}}_value" ng-model="searchStr" type="text" placeholder="{{placeholder}}" class="form-control {{inputClass}}" onmouseup="this.select();" ng-focus="resetHideResults()" ng-blur="hideResults()" />'+
                '<div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown">'+
                    '<div class="angucomplete-searching" ng-show="searching">Поиск...</div>'+
                    '<div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)">По вашему запросу ничего не найдено</div>'+
                    '<ul class="list-group">'+
                        '<li class="list-group-item" ng-repeat="result in results" ng-click="selectResult(result)">{{ result.title }}</li>'+
                    '</ul>'+
                '</div>'+
            '</div>',

        link: function(scope, elem) {
            scope.lastSearchTerm = null;
            scope.currentIndex = null;
            scope.justChanged = false;
            scope.searchTimer = null;
            scope.hideTimer = null;
            scope.searching = false;
            scope.pause = 500;
            scope.minLength = 3;
            scope.searchStr = null;
            scope.params = null;

            var modelWatch = scope.$watch('selectedObject', function (model) {
                if(model) {
                    scope.searchStr = model;
                    modelWatch();
                }
            });

            if (scope.minLengthUser && scope.minLengthUser != "") {
                scope.minLength = scope.minLengthUser;
            }

            if (scope.userPause) {
                scope.pause = scope.userPause;
            }
            if (scope.userParams) {
                scope.params = scope.userParams;
            }

            var isNewSearchNeeded = function(newTerm, oldTerm) {
                return newTerm.length >= scope.minLength && newTerm != oldTerm
            };

            scope.processResults = function(responseData, str) {
                if (responseData && responseData.length > 0) {
                    scope.results = [];

                    var titleFields = [];
                    if (scope.titleField && scope.titleField != "") {
                        titleFields = scope.titleField.split(",");
                    }

                    for (var i = 0; i < responseData.length; i++) {
                        var titleCode = [];

                        for (var t = 0; t < titleFields.length; t++) {
                            titleCode.push(responseData[i][titleFields[t]]);
                        }

                        var description = "";
                        if (scope.descriptionField) {
                            description = responseData[i][scope.descriptionField];
                        }

                        var imageUri = "";
                        if (scope.imageUri) {
                            imageUri = scope.imageUri;
                        }

                        var image = "";
                        if (scope.imageField) {
                            image = imageUri + responseData[i][scope.imageField];
                        }

                        var text = titleCode.join(' ');
                        if (scope.matchClass) {
                            var re = new RegExp(str, 'i');
                            var strPart = text.match(re)[0];
                            text = $sce.trustAsHtml(text.replace(re, '<span class="'+ scope.matchClass +'">'+ strPart +'</span>'));
                        }

                        var resultRow = {
                            title: text,
                            description: description,
                            image: image,
                            originalObject: responseData[i]
                        };

                        scope.results[scope.results.length] = resultRow;
                    }


                } else {
                    scope.results = [];
                }
            };

            scope.searchTimerComplete = function(str) {
                if (str.length >= scope.minLength) {
                    if (scope.localData) {
                        var searchFields = scope.searchFields.split(",");

                        var matches = [];

                        for (var i = 0; i < scope.localData.length; i++) {
                            var match = false;

                            for (var s = 0; s < searchFields.length; s++) {
                                match = match || (typeof scope.localData[i][searchFields[s]] === 'string' && typeof str === 'string' && scope.localData[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
                            }

                            if (match) {
                                matches[matches.length] = scope.localData[i];
                            }
                        }

                        scope.searching = false;
                        scope.processResults(matches, str);

                    } else {
                        $http.get(scope.url + str, {params:scope.userParams}).
                            success(function(responseData, status, headers, config) {
                                scope.searching = false;
                                scope.processResults(((scope.dataField) ? responseData[scope.dataField] : responseData ), str);
                            }).
                            error(function(data, status, headers, config) {
                                console.log("error");
                            });
                    }
                }
            };

            scope.hideResults = function() {
                scope.hideTimer = $timeout(function() {
                    scope.showDropdown = false;
                }, scope.pause);
            };

            scope.resetHideResults = function() {
                if(scope.hideTimer) {
                    $timeout.cancel(scope.hideTimer);
                };
            };

            scope.keyPressed = function(event) {
                if (!(event.which == 38 || event.which == 40 || event.which == 13)) {
                    if (!scope.searchStr || scope.searchStr == "") {
                        scope.showDropdown = false;
                        scope.lastSearchTerm = null
                    } else if (isNewSearchNeeded(scope.searchStr, scope.lastSearchTerm)) {
                        scope.lastSearchTerm = scope.searchStr
                        scope.showDropdown = true;
                        scope.currentIndex = -1;
                        scope.results = [];

                        if (scope.searchTimer) {
                            $timeout.cancel(scope.searchTimer);
                        }

                        scope.searching = true;

                        scope.searchTimer = $timeout(function() {
                            scope.searchTimerComplete(scope.searchStr);
                        }, scope.pause);
                    }
                } else {
                    event.preventDefault();
                }
            };

            scope.selectResult = function(result) {
                if (scope.matchClass) {
                    result.title = result.title.toString().replace(/(<([^>]+)>)/ig, '');
                }
                scope.searchStr = scope.lastSearchTerm = result.title;
                scope.selectedObject = result;
                scope.showDropdown = false;
                scope.results = [];
                $rootScope.selectedItem = result.originalObject;
                scope.aClick();
            };

            var inputField = elem.find('input');

            inputField.on('keyup', scope.keyPressed);

            elem.on("keyup", function (event) {
                if(event.which === 40) {
                    if (scope.results && (scope.currentIndex + 1) < scope.results.length) {
                        scope.currentIndex ++;
                        scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                    scope.$apply();
                } else if(event.which == 38) {
                    if (scope.currentIndex >= 1) {
                        scope.currentIndex --;
                        scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 13) {
                    if (scope.results && scope.currentIndex >= 0 && scope.currentIndex < scope.results.length) {
                        scope.selectResult(scope.results[scope.currentIndex]);
                        scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    } else {
                        scope.results = [];
                        scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 27) {
                    scope.results = [];
                    scope.showDropdown = false;
                    scope.$apply();
                } else if (event.which == 8) {
                    scope.selectedObject = null;
                    scope.$apply();
                }
            });

        }
    };
}]);
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
rest.directive('ckEditor', [function () {
    return {
        require: '?ngModel',
        restrict: 'C',
        link: function (scope, elm, attr, model) {
            var isReady = false;
            var data = [];
            var ck = CKEDITOR.replace(elm[0]);
            var updateModel;

            function setData() {
                if (!data.length) {
                    return;
                }

                var d = data.splice(0, 1);
                ck.setData(d[0] || '<span></span>', function () {
                    setData();
                    isReady = true;
                });
            }

            ck.on('instanceReady', function (e) {
                if (model) {
                    setData();
                }
            });
            updateModel = function () {
                scope.$apply(function () {
                    var data = ck.getData();
                    if (data == '<span></span>') {
                        data = null;
                    }
                    model.$setViewValue(data);
                });
            };

            elm.bind('$destroy', function () {
                ck.destroy(false);
            });

            $(document).on('keyup',updateModel);
            if (model) {
                ck.on('change', updateModel);
                ck.on('change', updateModel);
                ck.on('dataReady', updateModel);
                ck.on('key', updateModel);
                ck.on('paste', updateModel);
                ck.on('selectionChange', updateModel);

                model.$render = function (value) {
                    if (model.$viewValue === undefined) {
                        model.$setViewValue(null);
                        model.$viewValue = null;
                    }

                    data.push(model.$viewValue);

                    if (isReady) {
                        isReady = false;
                        setData();
                    }
                };
            }

        }
    };
}]);



rest.directive('alertModal', function () {
    return {
        templateUrl: "/views/directives/ng-alert.html",
        restrict: 'E',
        transclude: true,
        replace:true,
        scope:true,
        link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;

            scope.$watch(attrs.visible, function(value){
                if(value == true) {
                    // $(element).modal('show');
                } else {
                    // $(element).modal('hide');
                }
            });

            $(element).on('shown.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = true;
                });
            });

            $(element).on('hidden.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = false;
                });
            });
        }
    };
});
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
rest.directive('ngThumb', ['$window', function($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function(file) {
            var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    return {
        restrict: 'A',
        template: '<canvas/>',
        link: function(scope, element, attributes) {
            if (!helper.support) return;

            var params = scope.$eval(attributes.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var canvas = element.find('canvas');
            var reader = new FileReader();

            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image();
                img.onload = onLoadImage;
                img.src = event.target.result;
            }

            function onLoadImage() {
                var width = params.width || this.width / this.height * params.height;
                var height = params.height || this.height / this.width * params.width;
                canvas.attr({ width: width, height: height });
                canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
            }
        }
    };
}]);

/*
 jQuery UI Slider plugin wrapper
 */
angular.module('ui.slider', []).value('uiSliderConfig',{}).directive('uiSlider', ['uiSliderConfig', '$timeout', function(uiSliderConfig, $timeout) {
    uiSliderConfig = uiSliderConfig || {};
    return {
        require: 'ngModel',
        compile: function() {
            var preLink = function (scope, elm, attrs, ngModel) {

                function parseNumber(n, decimals) {
                    return (decimals) ? parseFloat(n) : parseInt(n, 10);
                }

                var directiveOptions = angular.copy(scope.$eval(attrs.uiSlider));
                var options = angular.extend(directiveOptions || {}, uiSliderConfig);
                // Object holding range values
                var prevRangeValues = {
                    min: null,
                    max: null
                };

                // convenience properties
                var properties = ['min', 'max', 'step', 'lowerBound', 'upperBound'];
                var useDecimals = (!angular.isUndefined(attrs.useDecimals)) ? true : false;

                var init = function() {
                    // When ngModel is assigned an array of values then range is expected to be true.
                    // Warn user and change range to true else an error occurs when trying to drag handle
                    if (angular.isArray(ngModel.$viewValue) && options.range !== true) {
                        console.warn('Change your range option of ui-slider. When assigning ngModel an array of values then the range option should be set to true.');
                        options.range = true;
                    }

                    // Ensure the convenience properties are passed as options if they're defined
                    // This avoids init ordering issues where the slider's initial state (eg handle
                    // position) is calculated using widget defaults
                    // Note the properties take precedence over any duplicates in options
                    angular.forEach(properties, function(property) {
                        if (angular.isDefined(attrs[property])) {
                            options[property] = parseNumber(attrs[property], useDecimals);
                        }
                    });

                    elm.slider(options);
                    init = angular.noop;
                };

                // Find out if decimals are to be used for slider
                angular.forEach(properties, function(property) {
                    // support {{}} and watch for updates
                    attrs.$observe(property, function(newVal) {
                        if (!!newVal) {
                            init();
                            options[property] = parseNumber(newVal, useDecimals);
                            elm.slider('option', property, parseNumber(newVal, useDecimals));
                            ngModel.$render();
                        }
                    });
                });
                attrs.$observe('disabled', function(newVal) {
                    init();
                    elm.slider('option', 'disabled', !!newVal);
                });

                // Watch ui-slider (byVal) for changes and update
                scope.$watch(attrs.uiSlider, function(newVal) {
                    init();
                    if(newVal !== undefined) {
                        elm.slider('option', newVal);
                    }
                }, true);

                // Late-bind to prevent compiler clobbering
                $timeout(init, 0, true);

                // Update model value from slider
                elm.bind('slide', function(event, ui) {
                    var valuesChanged;

                    if (ui.values) {
                        var boundedValues = ui.values.slice();

                        if (options.lowerBound && boundedValues[0] < options.lowerBound) {
                            boundedValues[0] = Math.max(boundedValues[0], options.lowerBound);
                        }
                        if (options.upperBound && boundedValues[1] > options.upperBound) {
                            boundedValues[1] = Math.min(boundedValues[1], options.upperBound);
                        }

                        if (boundedValues[0] !== ui.values[0] || boundedValues[1] !== ui.values[1]) {
                            valuesChanged = true;
                            ui.values = boundedValues;
                        }
                    } else {
                        var boundedValue = ui.value;

                        if (options.lowerBound && boundedValue < options.lowerBound) {
                            boundedValue = Math.max(boundedValue, options.lowerBound);
                        }
                        if (options.upperBound && boundedValue > options.upperBound) {
                            boundedValue = Math.min(boundedValue, options.upperBound);
                        }

                        if (boundedValue !== ui.value) {
                            valuesChanged = true;
                            ui.value = boundedValue;
                        }
                    }


                    ngModel.$setViewValue(ui.values || ui.value);
                    $(ui.handle).find('.ui-slider-tip').text(ui.value);
                    scope.$apply();

                    if (valuesChanged) {
                        setTimeout(function() {
                            elm.slider('value', ui.values || ui.value);
                        }, 0);

                        return false;
                    }
                });

                // Update slider from model value
                ngModel.$render = function() {
                    init();
                    var method = options.range === true ? 'values' : 'value';

                    if (options.range !== true && isNaN(ngModel.$viewValue) && !(ngModel.$viewValue instanceof Array)) {
                        ngModel.$viewValue = 0;
                    }
                    else if (options.range && !angular.isDefined(ngModel.$viewValue)) {
                        ngModel.$viewValue = [0,0];
                    }

                    // Do some sanity check of range values
                    if (options.range === true) {
                        // previously, the model was a string b/c it was in a text input, need to convert to a array.
                        // make sure input exists, comma exists once, and it is a string.
                        if (ngModel.$viewValue && angular.isString(ngModel.$viewValue) && (ngModel.$viewValue.match(/,/g) || []).length === 1) {
                            // transform string model into array.
                            var valueArr = ngModel.$viewValue.split(',');
                            ngModel.$viewValue = [Number(valueArr[0]), Number(valueArr[1])];
                        }
                        // Check outer bounds for min and max values
                        if (angular.isDefined(options.min) && options.min > ngModel.$viewValue[0]) {
                            ngModel.$viewValue[0] = options.min;
                        }
                        if (angular.isDefined(options.max) && options.max < ngModel.$viewValue[1]) {
                            ngModel.$viewValue[1] = options.max;
                        }

                        // Check min and max range values
                        if (ngModel.$viewValue[0] > ngModel.$viewValue[1]) {
                            // Min value should be less to equal to max value
                            if (prevRangeValues.min >= ngModel.$viewValue[1]) {
                                ngModel.$viewValue[1] = prevRangeValues.min;
                            }
                            // Max value should be less to equal to min value
                            if (prevRangeValues.max <= ngModel.$viewValue[0]) {
                                ngModel.$viewValue[0] = prevRangeValues.max;
                            }
                        }

                        // Store values for later user
                        prevRangeValues.min = ngModel.$viewValue[0];
                        prevRangeValues.max = ngModel.$viewValue[1];

                    }
                    elm.slider(method, ngModel.$viewValue);
                };

                scope.$watch(attrs.ngModel, function() {
                    if (options.range === true) {
                        ngModel.$render();
                    }
                }, true);

                function destroy() {
                    if (elm.hasClass('ui-slider')) {
                        elm.slider('destroy');
                    }
                }

                scope.$on("$destroy", destroy);
                elm.one('$destroy', destroy);
            };

            var postLink = function (scope, element, attrs, ngModel) {
                // Add tick marks if 'tick' and 'step' attributes have been setted on element.
                // Support horizontal slider bar so far. 'tick' and 'step' attributes are required.
                var options = angular.extend({}, scope.$eval(attrs.uiSlider));
                var properties = ['min', 'max', 'step', 'tick', 'tip'];
                angular.forEach(properties, function(property) {
                    if (angular.isDefined(attrs[property])) {
                        options[property] = attrs[property];
                    }
                });
                if (angular.isDefined(options['tick']) && angular.isDefined(options['step'])) {
                    var total = parseInt( (parseInt(options['max']) - parseInt(options['min'])) /parseInt(options['step']));
                    for (var i = total; i >= 0; i--) {
                        var left = ((i / total) * 100) + '%';
                        $("<div/>").addClass("ui-slider-tick").appendTo(element).css({left: left});
                    };
                }
                if(angular.isDefined(options['tip'])) {
                    $timeout(function(){element.find('.ui-slider-handle').append('<div class="ui-slider-tip">'+ngModel.$viewValue+'</div>')},10);
                }
            }

            return {
                pre: preLink,
                post: postLink
            };
        }
    };
}]);
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
rest.directive('escKey', function () {
    return function (scope, element, attrs) {
        element.bind('keydown keypress', function (event) {
            if(event.which === 27) {
                scope.$apply(function (){
                    scope.$eval(attrs.escKey);
                });

                event.preventDefault();
            }
        });
    };
});
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
rest.directive('onLastRepeat', function() {
    return function(scope, element, attrs) {
        if (scope.$last) {
            setTimeout(function () {
                scope.$emit('onRepeatLast', element, attrs);
            }, 1);
        }
    };
});
/*!
 * Bootstrap-select v1.9.4 (http://silviomoreto.github.io/bootstrap-select)
 *
 * Copyright 2013-2016 bootstrap-select
 * Licensed under MIT (https://github.com/silviomoreto/bootstrap-select/blob/master/LICENSE)
 */
!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("jquery")):b(jQuery)}(this,function(a){!function(a){"use strict";function b(b){var c=[{re:/[\xC0-\xC6]/g,ch:"A"},{re:/[\xE0-\xE6]/g,ch:"a"},{re:/[\xC8-\xCB]/g,ch:"E"},{re:/[\xE8-\xEB]/g,ch:"e"},{re:/[\xCC-\xCF]/g,ch:"I"},{re:/[\xEC-\xEF]/g,ch:"i"},{re:/[\xD2-\xD6]/g,ch:"O"},{re:/[\xF2-\xF6]/g,ch:"o"},{re:/[\xD9-\xDC]/g,ch:"U"},{re:/[\xF9-\xFC]/g,ch:"u"},{re:/[\xC7-\xE7]/g,ch:"c"},{re:/[\xD1]/g,ch:"N"},{re:/[\xF1]/g,ch:"n"}];return a.each(c,function(){b=b.replace(this.re,this.ch)}),b}function c(a){var b={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},c="(?:"+Object.keys(b).join("|")+")",d=new RegExp(c),e=new RegExp(c,"g"),f=null==a?"":""+a;return d.test(f)?f.replace(e,function(a){return b[a]}):f}function d(b,c){var d=arguments,f=b,g=c;[].shift.apply(d);var h,i=this.each(function(){var b=a(this);if(b.is("select")){var c=b.data("selectpicker"),i="object"==typeof f&&f;if(c){if(i)for(var j in i)i.hasOwnProperty(j)&&(c.options[j]=i[j])}else{var k=a.extend({},e.DEFAULTS,a.fn.selectpicker.defaults||{},b.data(),i);k.template=a.extend({},e.DEFAULTS.template,a.fn.selectpicker.defaults?a.fn.selectpicker.defaults.template:{},b.data().template,i.template),b.data("selectpicker",c=new e(this,k,g))}"string"==typeof f&&(h=c[f]instanceof Function?c[f].apply(c,d):c.options[f])}});return"undefined"!=typeof h?h:i}String.prototype.includes||!function(){var a={}.toString,b=function(){try{var a={},b=Object.defineProperty,c=b(a,a,a)&&b}catch(d){}return c}(),c="".indexOf,d=function(b){if(null==this)throw new TypeError;var d=String(this);if(b&&"[object RegExp]"==a.call(b))throw new TypeError;var e=d.length,f=String(b),g=f.length,h=arguments.length>1?arguments[1]:void 0,i=h?Number(h):0;i!=i&&(i=0);var j=Math.min(Math.max(i,0),e);return g+j>e?!1:-1!=c.call(d,f,i)};b?b(String.prototype,"includes",{value:d,configurable:!0,writable:!0}):String.prototype.includes=d}(),String.prototype.startsWith||!function(){var a=function(){try{var a={},b=Object.defineProperty,c=b(a,a,a)&&b}catch(d){}return c}(),b={}.toString,c=function(a){if(null==this)throw new TypeError;var c=String(this);if(a&&"[object RegExp]"==b.call(a))throw new TypeError;var d=c.length,e=String(a),f=e.length,g=arguments.length>1?arguments[1]:void 0,h=g?Number(g):0;h!=h&&(h=0);var i=Math.min(Math.max(h,0),d);if(f+i>d)return!1;for(var j=-1;++j<f;)if(c.charCodeAt(i+j)!=e.charCodeAt(j))return!1;return!0};a?a(String.prototype,"startsWith",{value:c,configurable:!0,writable:!0}):String.prototype.startsWith=c}(),Object.keys||(Object.keys=function(a,b,c){c=[];for(b in a)c.hasOwnProperty.call(a,b)&&c.push(b);return c}),a.fn.triggerNative=function(a){var b,c=this[0];c.dispatchEvent?("function"==typeof Event?b=new Event(a,{bubbles:!0}):(b=document.createEvent("Event"),b.initEvent(a,!0,!1)),c.dispatchEvent(b)):(c.fireEvent&&(b=document.createEventObject(),b.eventType=a,c.fireEvent("on"+a,b)),this.trigger(a))},a.expr[":"].icontains=function(b,c,d){var e=a(b),f=(e.data("tokens")||e.text()).toUpperCase();return f.includes(d[3].toUpperCase())},a.expr[":"].ibegins=function(b,c,d){var e=a(b),f=(e.data("tokens")||e.text()).toUpperCase();return f.startsWith(d[3].toUpperCase())},a.expr[":"].aicontains=function(b,c,d){var e=a(b),f=(e.data("tokens")||e.data("normalizedText")||e.text()).toUpperCase();return f.includes(d[3].toUpperCase())},a.expr[":"].aibegins=function(b,c,d){var e=a(b),f=(e.data("tokens")||e.data("normalizedText")||e.text()).toUpperCase();return f.startsWith(d[3].toUpperCase())};var e=function(b,c,d){d&&(d.stopPropagation(),d.preventDefault()),this.$element=a(b),this.$newElement=null,this.$button=null,this.$menu=null,this.$lis=null,this.options=c,null===this.options.title&&(this.options.title=this.$element.attr("title")),this.val=e.prototype.val,this.render=e.prototype.render,this.refresh=e.prototype.refresh,this.setStyle=e.prototype.setStyle,this.selectAll=e.prototype.selectAll,this.deselectAll=e.prototype.deselectAll,this.destroy=e.prototype.destroy,this.remove=e.prototype.remove,this.show=e.prototype.show,this.hide=e.prototype.hide,this.init()};e.VERSION="1.9.4",e.DEFAULTS={noneSelectedText:"Nothing selected",noneResultsText:"No results matched {0}",countSelectedText:function(a,b){return 1==a?"{0} item selected":"{0} items selected"},maxOptionsText:function(a,b){return[1==a?"Limit reached ({n} item max)":"Limit reached ({n} items max)",1==b?"Group limit reached ({n} item max)":"Group limit reached ({n} items max)"]},selectAllText:"Select All",deselectAllText:"Deselect All",doneButton:!1,doneButtonText:"Close",multipleSeparator:", ",styleBase:"btn",style:"btn-default",size:"auto",title:null,selectedTextFormat:"values",width:!1,container:!1,hideDisabled:!1,showSubtext:!1,showIcon:!0,showContent:!0,dropupAuto:!0,header:!1,liveSearch:!1,liveSearchPlaceholder:null,liveSearchNormalize:!1,liveSearchStyle:"contains",actionsBox:!1,iconBase:"glyphicon",tickIcon:"glyphicon-ok",template:{caret:'<span class="caret"></span>'},maxOptions:!1,mobile:!1,selectOnTab:!1,dropdownAlignRight:!1},e.prototype={constructor:e,init:function(){var b=this,c=this.$element.attr("id");this.liObj={},this.multiple=this.$element.prop("multiple"),this.autofocus=this.$element.prop("autofocus"),this.$newElement=this.createView(),this.$element.after(this.$newElement).appendTo(this.$newElement),this.$button=this.$newElement.children("button"),this.$menu=this.$newElement.children(".dropdown-menu"),this.$menuInner=this.$menu.children(".inner"),this.$searchbox=this.$menu.find("input"),this.options.dropdownAlignRight&&this.$menu.addClass("dropdown-menu-right"),"undefined"!=typeof c&&(this.$button.attr("data-id",c),a('label[for="'+c+'"]').click(function(a){a.preventDefault(),b.$button.focus()})),this.checkDisabled(),this.clickListener(),this.options.liveSearch&&this.liveSearchListener(),this.render(),this.setStyle(),this.setWidth(),this.options.container&&this.selectPosition(),this.$menu.data("this",this),this.$newElement.data("this",this),this.options.mobile&&this.mobile(),this.$newElement.on({"hide.bs.dropdown":function(a){b.$element.trigger("hide.bs.select",a)},"hidden.bs.dropdown":function(a){b.$element.trigger("hidden.bs.select",a)},"show.bs.dropdown":function(a){b.$element.trigger("show.bs.select",a)},"shown.bs.dropdown":function(a){b.$element.trigger("shown.bs.select",a)}}),b.$element[0].hasAttribute("required")&&this.$element.on("invalid",function(){b.$button.addClass("bs-invalid").focus(),b.$element.on({"focus.bs.select":function(){b.$button.focus(),b.$element.off("focus.bs.select")},"shown.bs.select":function(){b.$element.val(b.$element.val()).off("shown.bs.select")},"rendered.bs.select":function(){this.validity.valid&&b.$button.removeClass("bs-invalid"),b.$element.off("rendered.bs.select")}})}),setTimeout(function(){b.$element.trigger("loaded.bs.select")})},createDropdown:function(){var b=this.multiple?" show-tick":"",d=this.$element.parent().hasClass("input-group")?" input-group-btn":"",e=this.autofocus?" autofocus":"",f=this.options.header?'<div class="popover-title"><button type="button" class="close" aria-hidden="true">&times;</button>'+this.options.header+"</div>":"",g=this.options.liveSearch?'<div class="bs-searchbox"><input type="text" class="form-control" autocomplete="off"'+(null===this.options.liveSearchPlaceholder?"":' placeholder="'+c(this.options.liveSearchPlaceholder)+'"')+"></div>":"",h=this.multiple&&this.options.actionsBox?'<div class="bs-actionsbox"><div class="btn-group btn-group-sm btn-block"><button type="button" class="actions-btn bs-select-all btn btn-default">'+this.options.selectAllText+'</button><button type="button" class="actions-btn bs-deselect-all btn btn-default">'+this.options.deselectAllText+"</button></div></div>":"",i=this.multiple&&this.options.doneButton?'<div class="bs-donebutton"><div class="btn-group btn-block"><button type="button" class="btn btn-sm btn-default">'+this.options.doneButtonText+"</button></div></div>":"",j='<div class="btn-group bootstrap-select'+b+d+'"><button type="button" class="'+this.options.styleBase+' dropdown-toggle" data-toggle="dropdown"'+e+'><span class="filter-option pull-left"></span>&nbsp;<span class="bs-caret">'+this.options.template.caret+'</span></button><div class="dropdown-menu open">'+f+g+h+'<ul class="dropdown-menu inner" role="menu"></ul>'+i+"</div></div>";return a(j)},createView:function(){var a=this.createDropdown(),b=this.createLi();return a.find("ul")[0].innerHTML=b,a},reloadLi:function(){this.destroyLi();var a=this.createLi();this.$menuInner[0].innerHTML=a},destroyLi:function(){this.$menu.find("li").remove()},createLi:function(){var d=this,e=[],f=0,g=document.createElement("option"),h=-1,i=function(a,b,c,d){return"<li"+("undefined"!=typeof c&""!==c?' class="'+c+'"':"")+("undefined"!=typeof b&null!==b?' data-original-index="'+b+'"':"")+("undefined"!=typeof d&null!==d?'data-optgroup="'+d+'"':"")+">"+a+"</li>"},j=function(a,e,f,g){return'<a tabindex="0"'+("undefined"!=typeof e?' class="'+e+'"':"")+("undefined"!=typeof f?' style="'+f+'"':"")+(d.options.liveSearchNormalize?' data-normalized-text="'+b(c(a))+'"':"")+("undefined"!=typeof g||null!==g?' data-tokens="'+g+'"':"")+">"+a+'<span class="'+d.options.iconBase+" "+d.options.tickIcon+' check-mark"></span></a>'};if(this.options.title&&!this.multiple&&(h--,!this.$element.find(".bs-title-option").length)){var k=this.$element[0];g.className="bs-title-option",g.appendChild(document.createTextNode(this.options.title)),g.value="",k.insertBefore(g,k.firstChild),void 0===a(k.options[k.selectedIndex]).attr("selected")&&(g.selected=!0)}return this.$element.find("option").each(function(b){var c=a(this);if(h++,!c.hasClass("bs-title-option")){var g=this.className||"",k=this.style.cssText,l=c.data("content")?c.data("content"):c.html(),m=c.data("tokens")?c.data("tokens"):null,n="undefined"!=typeof c.data("subtext")?'<small class="text-muted">'+c.data("subtext")+"</small>":"",o="undefined"!=typeof c.data("icon")?'<span class="'+d.options.iconBase+" "+c.data("icon")+'"></span> ':"",p="OPTGROUP"===this.parentNode.tagName,q=this.disabled||p&&this.parentNode.disabled;if(""!==o&&q&&(o="<span>"+o+"</span>"),d.options.hideDisabled&&q&&!p)return void h--;if(c.data("content")||(l=o+'<span class="text">'+l+n+"</span>"),p&&c.data("divider")!==!0){var r=" "+this.parentNode.className||"";if(0===c.index()){f+=1;var s=this.parentNode.label,t="undefined"!=typeof c.parent().data("subtext")?'<small class="text-muted">'+c.parent().data("subtext")+"</small>":"",u=c.parent().data("icon")?'<span class="'+d.options.iconBase+" "+c.parent().data("icon")+'"></span> ':"";s=u+'<span class="text">'+s+t+"</span>",0!==b&&e.length>0&&(h++,e.push(i("",null,"divider",f+"div"))),h++,e.push(i(s,null,"dropdown-header"+r,f))}if(d.options.hideDisabled&&q)return void h--;e.push(i(j(l,"opt "+g+r,k,m),b,"",f))}else c.data("divider")===!0?e.push(i("",b,"divider")):c.data("hidden")===!0?e.push(i(j(l,g,k,m),b,"hidden is-hidden")):(this.previousElementSibling&&"OPTGROUP"===this.previousElementSibling.tagName&&(h++,e.push(i("",null,"divider",f+"div"))),e.push(i(j(l,g,k,m),b)));d.liObj[b]=h}}),this.multiple||0!==this.$element.find("option:selected").length||this.options.title||this.$element.find("option").eq(0).prop("selected",!0).attr("selected","selected"),e.join("")},findLis:function(){return null==this.$lis&&(this.$lis=this.$menu.find("li")),this.$lis},render:function(b){var c,d=this;b!==!1&&this.$element.find("option").each(function(a){var b=d.findLis().eq(d.liObj[a]);d.setDisabled(a,this.disabled||"OPTGROUP"===this.parentNode.tagName&&this.parentNode.disabled,b),d.setSelected(a,this.selected,b)}),this.tabIndex();var e=this.$element.find("option").map(function(){if(this.selected){if(d.options.hideDisabled&&(this.disabled||"OPTGROUP"===this.parentNode.tagName&&this.parentNode.disabled))return;var b,c=a(this),e=c.data("icon")&&d.options.showIcon?'<i class="'+d.options.iconBase+" "+c.data("icon")+'"></i> ':"";return b=d.options.showSubtext&&c.data("subtext")&&!d.multiple?' <small class="text-muted">'+c.data("subtext")+"</small>":"","undefined"!=typeof c.attr("title")?c.attr("title"):c.data("content")&&d.options.showContent?c.data("content"):e+c.html()+b}}).toArray(),f=this.multiple?e.join(this.options.multipleSeparator):e[0];if(this.multiple&&this.options.selectedTextFormat.indexOf("count")>-1){var g=this.options.selectedTextFormat.split(">");if(g.length>1&&e.length>g[1]||1==g.length&&e.length>=2){c=this.options.hideDisabled?", [disabled]":"";var h=this.$element.find("option").not('[data-divider="true"], [data-hidden="true"]'+c).length,i="function"==typeof this.options.countSelectedText?this.options.countSelectedText(e.length,h):this.options.countSelectedText;f=i.replace("{0}",e.length.toString()).replace("{1}",h.toString())}}void 0==this.options.title&&(this.options.title=this.$element.attr("title")),"static"==this.options.selectedTextFormat&&(f=this.options.title),f||(f="undefined"!=typeof this.options.title?this.options.title:this.options.noneSelectedText),this.$button.attr("title",a.trim(f.replace(/<[^>]*>?/g,""))),this.$button.children(".filter-option").html(f),this.$element.trigger("rendered.bs.select")},setStyle:function(a,b){this.$element.attr("class")&&this.$newElement.addClass(this.$element.attr("class").replace(/selectpicker|mobile-device|bs-select-hidden|validate\[.*\]/gi,""));var c=a?a:this.options.style;"add"==b?this.$button.addClass(c):"remove"==b?this.$button.removeClass(c):(this.$button.removeClass(this.options.style),this.$button.addClass(c))},liHeight:function(b){if(b||this.options.size!==!1&&!this.sizeInfo){var c=document.createElement("div"),d=document.createElement("div"),e=document.createElement("ul"),f=document.createElement("li"),g=document.createElement("li"),h=document.createElement("a"),i=document.createElement("span"),j=this.options.header&&this.$menu.find(".popover-title").length>0?this.$menu.find(".popover-title")[0].cloneNode(!0):null,k=this.options.liveSearch?document.createElement("div"):null,l=this.options.actionsBox&&this.multiple&&this.$menu.find(".bs-actionsbox").length>0?this.$menu.find(".bs-actionsbox")[0].cloneNode(!0):null,m=this.options.doneButton&&this.multiple&&this.$menu.find(".bs-donebutton").length>0?this.$menu.find(".bs-donebutton")[0].cloneNode(!0):null;if(i.className="text",c.className=this.$menu[0].parentNode.className+" open",d.className="dropdown-menu open",e.className="dropdown-menu inner",f.className="divider",i.appendChild(document.createTextNode("Inner text")),h.appendChild(i),g.appendChild(h),e.appendChild(g),e.appendChild(f),j&&d.appendChild(j),k){var n=document.createElement("span");k.className="bs-searchbox",n.className="form-control",k.appendChild(n),d.appendChild(k)}l&&d.appendChild(l),d.appendChild(e),m&&d.appendChild(m),c.appendChild(d),document.body.appendChild(c);var o=h.offsetHeight,p=j?j.offsetHeight:0,q=k?k.offsetHeight:0,r=l?l.offsetHeight:0,s=m?m.offsetHeight:0,t=a(f).outerHeight(!0),u="function"==typeof getComputedStyle?getComputedStyle(d):!1,v=u?null:a(d),w=parseInt(u?u.paddingTop:v.css("paddingTop"))+parseInt(u?u.paddingBottom:v.css("paddingBottom"))+parseInt(u?u.borderTopWidth:v.css("borderTopWidth"))+parseInt(u?u.borderBottomWidth:v.css("borderBottomWidth")),x=w+parseInt(u?u.marginTop:v.css("marginTop"))+parseInt(u?u.marginBottom:v.css("marginBottom"))+2;document.body.removeChild(c),this.sizeInfo={liHeight:o,headerHeight:p,searchHeight:q,actionsHeight:r,doneButtonHeight:s,dividerHeight:t,menuPadding:w,menuExtras:x}}},setSize:function(){if(this.findLis(),this.liHeight(),this.options.header&&this.$menu.css("padding-top",0),this.options.size!==!1){var b,c,d,e,f=this,g=this.$menu,h=this.$menuInner,i=a(window),j=this.$newElement[0].offsetHeight,k=this.sizeInfo.liHeight,l=this.sizeInfo.headerHeight,m=this.sizeInfo.searchHeight,n=this.sizeInfo.actionsHeight,o=this.sizeInfo.doneButtonHeight,p=this.sizeInfo.dividerHeight,q=this.sizeInfo.menuPadding,r=this.sizeInfo.menuExtras,s=this.options.hideDisabled?".disabled":"",t=function(){d=f.$newElement.offset().top-i.scrollTop(),e=i.height()-d-j};if(t(),"auto"===this.options.size){var u=function(){var i,j=function(b,c){return function(d){return c?d.classList?d.classList.contains(b):a(d).hasClass(b):!(d.classList?d.classList.contains(b):a(d).hasClass(b))}},p=f.$menuInner[0].getElementsByTagName("li"),s=Array.prototype.filter?Array.prototype.filter.call(p,j("hidden",!1)):f.$lis.not(".hidden"),u=Array.prototype.filter?Array.prototype.filter.call(s,j("dropdown-header",!0)):s.filter(".dropdown-header");t(),b=e-r,f.options.container?(g.data("height")||g.data("height",g.height()),c=g.data("height")):c=g.height(),f.options.dropupAuto&&f.$newElement.toggleClass("dropup",d>e&&c>b-r),f.$newElement.hasClass("dropup")&&(b=d-r),i=s.length+u.length>3?3*k+r-2:0,g.css({"max-height":b+"px",overflow:"hidden","min-height":i+l+m+n+o+"px"}),h.css({"max-height":b-l-m-n-o-q+"px","overflow-y":"auto","min-height":Math.max(i-q,0)+"px"})};u(),this.$searchbox.off("input.getSize propertychange.getSize").on("input.getSize propertychange.getSize",u),i.off("resize.getSize scroll.getSize").on("resize.getSize scroll.getSize",u)}else if(this.options.size&&"auto"!=this.options.size&&this.$lis.not(s).length>this.options.size){var v=this.$lis.not(".divider").not(s).children().slice(0,this.options.size).last().parent().index(),w=this.$lis.slice(0,v+1).filter(".divider").length;b=k*this.options.size+w*p+q,f.options.container?(g.data("height")||g.data("height",g.height()),c=g.data("height")):c=g.height(),f.options.dropupAuto&&this.$newElement.toggleClass("dropup",d>e&&c>b-r),g.css({"max-height":b+l+m+n+o+"px",overflow:"hidden","min-height":""}),h.css({"max-height":b-q+"px","overflow-y":"auto","min-height":""})}}},setWidth:function(){if("auto"===this.options.width){this.$menu.css("min-width","0");var a=this.$menu.parent().clone().appendTo("body"),b=this.options.container?this.$newElement.clone().appendTo("body"):a,c=a.children(".dropdown-menu").outerWidth(),d=b.css("width","auto").children("button").outerWidth();a.remove(),b.remove(),this.$newElement.css("width",Math.max(c,d)+"px")}else"fit"===this.options.width?(this.$menu.css("min-width",""),this.$newElement.css("width","").addClass("fit-width")):this.options.width?(this.$menu.css("min-width",""),this.$newElement.css("width",this.options.width)):(this.$menu.css("min-width",""),this.$newElement.css("width",""));this.$newElement.hasClass("fit-width")&&"fit"!==this.options.width&&this.$newElement.removeClass("fit-width")},selectPosition:function(){this.$bsContainer=a('<div class="bs-container" />');var b,c,d=this,e=function(a){d.$bsContainer.addClass(a.attr("class").replace(/form-control|fit-width/gi,"")).toggleClass("dropup",a.hasClass("dropup")),b=a.offset(),c=a.hasClass("dropup")?0:a[0].offsetHeight,d.$bsContainer.css({top:b.top+c,left:b.left,width:a[0].offsetWidth})};this.$button.on("click",function(){var b=a(this);d.isDisabled()||(e(d.$newElement),d.$bsContainer.appendTo(d.options.container).toggleClass("open",!b.hasClass("open")).append(d.$menu))}),a(window).on("resize scroll",function(){e(d.$newElement)}),this.$element.on("hide.bs.select",function(){d.$menu.data("height",d.$menu.height()),d.$bsContainer.detach()})},setSelected:function(a,b,c){c||(c=this.findLis().eq(this.liObj[a])),c.toggleClass("selected",b)},setDisabled:function(a,b,c){c||(c=this.findLis().eq(this.liObj[a])),b?c.addClass("disabled").children("a").attr("href","#").attr("tabindex",-1):c.removeClass("disabled").children("a").removeAttr("href").attr("tabindex",0)},isDisabled:function(){return this.$element[0].disabled},checkDisabled:function(){var a=this;this.isDisabled()?(this.$newElement.addClass("disabled"),this.$button.addClass("disabled").attr("tabindex",-1)):(this.$button.hasClass("disabled")&&(this.$newElement.removeClass("disabled"),this.$button.removeClass("disabled")),-1!=this.$button.attr("tabindex")||this.$element.data("tabindex")||this.$button.removeAttr("tabindex")),this.$button.click(function(){return!a.isDisabled()})},tabIndex:function(){this.$element.data("tabindex")!==this.$element.attr("tabindex")&&-98!==this.$element.attr("tabindex")&&"-98"!==this.$element.attr("tabindex")&&(this.$element.data("tabindex",this.$element.attr("tabindex")),this.$button.attr("tabindex",this.$element.data("tabindex"))),this.$element.attr("tabindex",-98)},clickListener:function(){var b=this,c=a(document);this.$newElement.on("touchstart.dropdown",".dropdown-menu",function(a){a.stopPropagation()}),c.data("spaceSelect",!1),this.$button.on("keyup",function(a){/(32)/.test(a.keyCode.toString(10))&&c.data("spaceSelect")&&(a.preventDefault(),c.data("spaceSelect",!1))}),this.$button.on("click",function(){b.setSize(),b.$element.on("shown.bs.select",function(){if(b.options.liveSearch||b.multiple){if(!b.multiple){var a=b.liObj[b.$element[0].selectedIndex];if("number"!=typeof a||b.options.size===!1)return;var c=b.$lis.eq(a)[0].offsetTop-b.$menuInner[0].offsetTop;c=c-b.$menuInner[0].offsetHeight/2+b.sizeInfo.liHeight/2,b.$menuInner[0].scrollTop=c}}else b.$menuInner.find(".selected a").focus()})}),this.$menuInner.on("click","li a",function(c){var d=a(this),e=d.parent().data("originalIndex"),f=b.$element.val(),g=b.$element.prop("selectedIndex");if(b.multiple&&c.stopPropagation(),c.preventDefault(),!b.isDisabled()&&!d.parent().hasClass("disabled")){var h=b.$element.find("option"),i=h.eq(e),j=i.prop("selected"),k=i.parent("optgroup"),l=b.options.maxOptions,m=k.data("maxOptions")||!1;if(b.multiple){if(i.prop("selected",!j),b.setSelected(e,!j),d.blur(),l!==!1||m!==!1){var n=l<h.filter(":selected").length,o=m<k.find("option:selected").length;if(l&&n||m&&o)if(l&&1==l)h.prop("selected",!1),i.prop("selected",!0),b.$menuInner.find(".selected").removeClass("selected"),b.setSelected(e,!0);else if(m&&1==m){k.find("option:selected").prop("selected",!1),i.prop("selected",!0);var p=d.parent().data("optgroup");b.$menuInner.find('[data-optgroup="'+p+'"]').removeClass("selected"),b.setSelected(e,!0)}else{var q="function"==typeof b.options.maxOptionsText?b.options.maxOptionsText(l,m):b.options.maxOptionsText,r=q[0].replace("{n}",l),s=q[1].replace("{n}",m),t=a('<div class="notify"></div>');q[2]&&(r=r.replace("{var}",q[2][l>1?0:1]),s=s.replace("{var}",q[2][m>1?0:1])),i.prop("selected",!1),b.$menu.append(t),l&&n&&(t.append(a("<div>"+r+"</div>")),b.$element.trigger("maxReached.bs.select")),m&&o&&(t.append(a("<div>"+s+"</div>")),b.$element.trigger("maxReachedGrp.bs.select")),setTimeout(function(){b.setSelected(e,!1)},10),t.delay(750).fadeOut(300,function(){a(this).remove()})}}}else h.prop("selected",!1),i.prop("selected",!0),b.$menuInner.find(".selected").removeClass("selected"),b.setSelected(e,!0);b.multiple?b.options.liveSearch&&b.$searchbox.focus():b.$button.focus(),(f!=b.$element.val()&&b.multiple||g!=b.$element.prop("selectedIndex")&&!b.multiple)&&(b.$element.triggerNative("change"),b.$element.trigger("changed.bs.select",[e,i.prop("selected"),j]))}}),this.$menu.on("click","li.disabled a, .popover-title, .popover-title :not(.close)",function(c){c.currentTarget==this&&(c.preventDefault(),c.stopPropagation(),b.options.liveSearch&&!a(c.target).hasClass("close")?b.$searchbox.focus():b.$button.focus())}),this.$menuInner.on("click",".divider, .dropdown-header",function(a){a.preventDefault(),a.stopPropagation(),b.options.liveSearch?b.$searchbox.focus():b.$button.focus()}),this.$menu.on("click",".popover-title .close",function(){b.$button.click()}),this.$searchbox.on("click",function(a){a.stopPropagation()}),this.$menu.on("click",".actions-btn",function(c){b.options.liveSearch?b.$searchbox.focus():b.$button.focus(),c.preventDefault(),c.stopPropagation(),a(this).hasClass("bs-select-all")?b.selectAll():b.deselectAll(),b.$element.triggerNative("change")}),this.$element.change(function(){b.render(!1)})},liveSearchListener:function(){var d=this,e=a('<li class="no-results"></li>');this.$button.on("click.dropdown.data-api touchstart.dropdown.data-api",function(){d.$menuInner.find(".active").removeClass("active"),d.$searchbox.val()&&(d.$searchbox.val(""),d.$lis.not(".is-hidden").removeClass("hidden"),e.parent().length&&e.remove()),d.multiple||d.$menuInner.find(".selected").addClass("active"),setTimeout(function(){d.$searchbox.focus()},10)}),this.$searchbox.on("click.dropdown.data-api focus.dropdown.data-api touchend.dropdown.data-api",function(a){a.stopPropagation()}),this.$searchbox.on("input propertychange",function(){if(d.$searchbox.val()){var f=d.$lis.not(".is-hidden").removeClass("hidden").children("a");f=d.options.liveSearchNormalize?f.not(":a"+d._searchStyle()+'("'+b(d.$searchbox.val())+'")'):f.not(":"+d._searchStyle()+'("'+d.$searchbox.val()+'")'),f.parent().addClass("hidden"),d.$lis.filter(".dropdown-header").each(function(){var b=a(this),c=b.data("optgroup");0===d.$lis.filter("[data-optgroup="+c+"]").not(b).not(".hidden").length&&(b.addClass("hidden"),d.$lis.filter("[data-optgroup="+c+"div]").addClass("hidden"))});var g=d.$lis.not(".hidden");g.each(function(b){var c=a(this);c.hasClass("divider")&&(c.index()===g.first().index()||c.index()===g.last().index()||g.eq(b+1).hasClass("divider"))&&c.addClass("hidden")}),d.$lis.not(".hidden, .no-results").length?e.parent().length&&e.remove():(e.parent().length&&e.remove(),e.html(d.options.noneResultsText.replace("{0}",'"'+c(d.$searchbox.val())+'"')).show(),d.$menuInner.append(e))}else d.$lis.not(".is-hidden").removeClass("hidden"),e.parent().length&&e.remove();d.$lis.filter(".active").removeClass("active"),d.$searchbox.val()&&d.$lis.not(".hidden, .divider, .dropdown-header").eq(0).addClass("active").children("a").focus(),a(this).focus()})},_searchStyle:function(){var a={begins:"ibegins",startsWith:"ibegins"};return a[this.options.liveSearchStyle]||"icontains"},val:function(a){return"undefined"!=typeof a?(this.$element.val(a),this.render(),this.$element):this.$element.val()},changeAll:function(b){"undefined"==typeof b&&(b=!0),this.findLis();for(var c=this.$element.find("option"),d=this.$lis.not(".divider, .dropdown-header, .disabled, .hidden").toggleClass("selected",b),e=d.length,f=[],g=0;e>g;g++){var h=d[g].getAttribute("data-original-index");f[f.length]=c.eq(h)[0]}a(f).prop("selected",b),this.render(!1)},selectAll:function(){return this.changeAll(!0)},deselectAll:function(){return this.changeAll(!1)},keydown:function(c){var d,e,f,g,h,i,j,k,l,m=a(this),n=m.is("input")?m.parent().parent():m.parent(),o=n.data("this"),p=":not(.disabled, .hidden, .dropdown-header, .divider)",q={32:" ",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",59:";",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",96:"0",97:"1",98:"2",99:"3",100:"4",101:"5",102:"6",103:"7",104:"8",105:"9"};if(o.options.liveSearch&&(n=m.parent().parent()),o.options.container&&(n=o.$menu),d=a("[role=menu] li",n),l=o.$newElement.hasClass("open"),!l&&(c.keyCode>=48&&c.keyCode<=57||c.keyCode>=96&&c.keyCode<=105||c.keyCode>=65&&c.keyCode<=90)&&(o.options.container?o.$button.trigger("click"):(o.setSize(),o.$menu.parent().addClass("open"),l=!0),o.$searchbox.focus()),o.options.liveSearch&&(/(^9$|27)/.test(c.keyCode.toString(10))&&l&&0===o.$menu.find(".active").length&&(c.preventDefault(),o.$menu.parent().removeClass("open"),o.options.container&&o.$newElement.removeClass("open"),o.$button.focus()),d=a("[role=menu] li"+p,n),m.val()||/(38|40)/.test(c.keyCode.toString(10))||0===d.filter(".active").length&&(d=o.$menuInner.find("li"),d=o.options.liveSearchNormalize?d.filter(":a"+o._searchStyle()+"("+b(q[c.keyCode])+")"):d.filter(":"+o._searchStyle()+"("+q[c.keyCode]+")"))),d.length){if(/(38|40)/.test(c.keyCode.toString(10)))e=d.index(d.find("a").filter(":focus").parent()),g=d.filter(p).first().index(),h=d.filter(p).last().index(),f=d.eq(e).nextAll(p).eq(0).index(),i=d.eq(e).prevAll(p).eq(0).index(),j=d.eq(f).prevAll(p).eq(0).index(),o.options.liveSearch&&(d.each(function(b){a(this).hasClass("disabled")||a(this).data("index",b)}),e=d.index(d.filter(".active")),g=d.first().data("index"),h=d.last().data("index"),f=d.eq(e).nextAll().eq(0).data("index"),i=d.eq(e).prevAll().eq(0).data("index"),j=d.eq(f).prevAll().eq(0).data("index")),k=m.data("prevIndex"),38==c.keyCode?(o.options.liveSearch&&e--,e!=j&&e>i&&(e=i),g>e&&(e=g),e==k&&(e=h)):40==c.keyCode&&(o.options.liveSearch&&e++,-1==e&&(e=0),e!=j&&f>e&&(e=f),e>h&&(e=h),e==k&&(e=g)),m.data("prevIndex",e),o.options.liveSearch?(c.preventDefault(),m.hasClass("dropdown-toggle")||(d.removeClass("active").eq(e).addClass("active").children("a").focus(),m.focus())):d.eq(e).children("a").focus();else if(!m.is("input")){var r,s,t=[];d.each(function(){a(this).hasClass("disabled")||a.trim(a(this).children("a").text().toLowerCase()).substring(0,1)==q[c.keyCode]&&t.push(a(this).index())}),r=a(document).data("keycount"),r++,a(document).data("keycount",r),s=a.trim(a(":focus").text().toLowerCase()).substring(0,1),s!=q[c.keyCode]?(r=1,a(document).data("keycount",r)):r>=t.length&&(a(document).data("keycount",0),r>t.length&&(r=1)),d.eq(t[r-1]).children("a").focus()}if((/(13|32)/.test(c.keyCode.toString(10))||/(^9$)/.test(c.keyCode.toString(10))&&o.options.selectOnTab)&&l){if(/(32)/.test(c.keyCode.toString(10))||c.preventDefault(),o.options.liveSearch)/(32)/.test(c.keyCode.toString(10))||(o.$menuInner.find(".active a").click(),m.focus());else{var u=a(":focus");u.click(),u.focus(),c.preventDefault(),a(document).data("spaceSelect",!0)}a(document).data("keycount",0)}(/(^9$|27)/.test(c.keyCode.toString(10))&&l&&(o.multiple||o.options.liveSearch)||/(27)/.test(c.keyCode.toString(10))&&!l)&&(o.$menu.parent().removeClass("open"),o.options.container&&o.$newElement.removeClass("open"),o.$button.focus())}},mobile:function(){this.$element.addClass("mobile-device")},refresh:function(){this.$lis=null,this.liObj={},this.reloadLi(),this.render(),this.checkDisabled(),this.liHeight(!0),this.setStyle(),this.setWidth(),this.$lis&&this.$searchbox.trigger("propertychange"),this.$element.trigger("refreshed.bs.select")},hide:function(){this.$newElement.hide()},show:function(){this.$newElement.show()},remove:function(){this.$newElement.remove(),this.$element.remove()},destroy:function(){this.$newElement.before(this.$element).remove(),this.$bsContainer?this.$bsContainer.remove():this.$menu.remove(),this.$element.off(".bs.select").removeData("selectpicker").removeClass("bs-select-hidden selectpicker")}};var f=a.fn.selectpicker;a.fn.selectpicker=d,a.fn.selectpicker.Constructor=e,a.fn.selectpicker.noConflict=function(){return a.fn.selectpicker=f,this},a(document).data("keycount",0).on("keydown.bs.select",'.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="menu"], .bs-searchbox input',e.prototype.keydown).on("focusin.modal",'.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="menu"], .bs-searchbox input',function(a){a.stopPropagation()}),a(window).on("load.bs.select.data-api",function(){a(".selectpicker").each(function(){var b=a(this);d.call(b,b.data())})})}(a)});
//# sourceMappingURL=bootstrap-select.js.map