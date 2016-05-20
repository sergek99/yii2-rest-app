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