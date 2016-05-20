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