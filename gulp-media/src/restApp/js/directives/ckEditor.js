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


