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
                    $uibModalInstance.close(response.project);
                }
            });
        };
    }
]);
