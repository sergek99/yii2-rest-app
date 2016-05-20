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