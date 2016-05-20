angular.module('ng.autocomplete', [] )
    .directive('ngAutocomplete', function ($parse, $http, $sce, $timeout, $rootScope) {
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
});