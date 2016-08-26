// TODO: HTTPS
var apiBaseUrl = "http://api.mineskin.org";
var websiteBaseUrl = "http://mineskin.org";

var mineskinApp = angular.module("mineskinApp", ["ngRoute", "ui.bootstrap", "ngLocationUpdate", "ngFileUpload"]);

mineskinApp.directive("ngPreloadSrc", function () {
    return {
        restrict: "A",
        replace: true,
        link: function (scope, element, attrs) {
            var $preloader = $("<img style='display:none'>");
            $preloader.attr("src", attrs.ngPreloadSrc);
            $preloader.on("load", function () {
                element.attr("src", attrs.ngPreloadSrc);
                $preloader.remove();
            });
            $preloader.on("error", function () {
                if (attrs.ngPreloadFallback) {
                    element.attr("src", attrs.ngPreloadFallback);
                }
                $preloader.remove();
            });
            $preloader.appendTo(element);
        }
    }
});

// Based on https://gist.github.com/Shoen/6350967
mineskinApp.directive('twitter', ["$timeout",
    function($timeout) {
        return {
            link: function(scope, element, attr) {
                $timeout(function() {
                    twttr.widgets.createShareButton(
                        attr.url,
                        element[0],
                        function(el) {}, {
                            count: 'none',
                            text: attr.text
                        }
                    );
                });
            }
        }
    }
]);

mineskinApp.config(function ($routeProvider) {

    $routeProvider
        .when("/", {
            templateUrl: "/pages/generator.html",
            controller: "generatorController"
        })
        .when("/gallery", {redirectTo: "/gallery/1"})
        .when("/gallery/:page?", {
            templateUrl: "/pages/gallery.html",
            controller: "galleryController"
        })
        .when("/:id", {
            templateUrl: "/pages/view.html",
            controller: "viewController"
        });

});

mineskinApp.controller("generatorController", ["$scope", "Upload", "$location", "$http", function ($scope, Upload, $location, $http) {
    $scope.skinUpload = undefined;
    $scope.skinUrl = undefined;
    $scope.skinUser = undefined;

    $scope.privateUpload = false;
    $scope.skinName = "";
    $scope.skinModel = "steve";

    $scope.generate = function () {
        console.log("  URL:");
        console.log($scope.skinUrl);

        console.log("  Upload:");
        console.log($scope.skinUpload);

        console.log("  User:");
        console.log($scope.skinUser);

        if ($scope.skinUrl) {
            var genAlert = $scope.addAlert("Generating Skin from URL...", "info", 10000);
            setTimeout(function () {
                $http({
                    url: apiBaseUrl + "/generate/url?url=" + $scope.skinUrl + "&name=" + $scope.skinName + "&model=" + $scope.skinModel + "&visibility=" + ($scope.privateUpload ? 1 : 0),
                    method: "POST"
                }).then(function (response) {
                    console.log(response);
                    if (!response.data.error) {
                        $scope.generateSuccess(response.data, genAlert);
                    } else {
                        $scope.generateError(response.data.error, genAlert);
                    }
                }, function (response) {
                    console.log(response);
                    $scope.generateError(response.data.error, genAlert);
                });
                // $.ajax({
                //     url: apiBaseUrl + "/generate/url?name=" + $scope.skinName + "&model=" + $scope.skinModel + "&visibility=" + (privateUpload ? 1 : 0) + "&callback=?",
                //     method: "POST",
                //     type: "POST",
                //     dataType: "jsonp",
                //     success: function (data) {
                //         if (!data.error) {
                //             $scope.generateSuccess(data, genAlert);
                //         } else {
                //             $scope.generateError(data.error, genAlert);
                //         }
                //     },
                //     error: function (error) {
                //         console.log(error);
                //         //TODO
                //     }
                // });
            }, 500);
        } else if ($scope.skinUpload) {
            var genAlert = $scope.addAlert("Uploading Skin...", "info", 10000);
            setTimeout(function () {
                Upload.upload({
                    url: apiBaseUrl + "/generate/upload?name=" + $scope.skinName + "&model=" + $scope.skinModel + "&visibility=" + ($scope.privateUpload ? 1 : 0),
                    method: "POST",
                    data: {file: $scope.skinUpload}
                }).then(function (response) {
                    console.log(response);
                    if (!response.data.error) {
                        $scope.generateSuccess(response.data, genAlert);
                    } else {
                        $scope.generateError(response.data.error, genAlert);
                    }
                }, function (response) {
                    console.log(response);
                    $scope.generateError(response.data.error, genAlert);
                });
            }, 500);
        } else if ($scope.skinUser) {
            var skinUuid;

            function generateUser(uuid) {
                var genAlert = $scope.addAlert("Loading skin data...", "info", 10000);
                setTimeout(function () {
                    $http({
                        url: apiBaseUrl + "/generate/user/" + uuid + "?name=" + $scope.skinName + "&model=" + $scope.skinModel + "&visibility=" + ($scope.privateUpload ? 1 : 0),
                        method: "GET"
                    }).then(function (response) {
                        console.log(response);
                        if (!response.data.error) {
                            $scope.generateSuccess(response.data, genAlert);
                        } else {
                            $scope.generateError(response.data.error, genAlert);
                        }
                    }, function (response) {
                        console.log(response);
                        $scope.generateError(response.data.error, genAlert);
                    });
                    // $.ajax({
                    //     url: apiBaseUrl + "/generate/user/" + uuid + "?name=" + $scope.skinName + "&visibility=" + (privateUpload ? 1 : 0) + "&callback=?",
                    //     method: "GET",
                    //     type: "GET",
                    //     dataType: "jsonp",
                    //     success: function (data) {
                    //         if (!data.error) {
                    //             $scope.generateSuccess(data, genAlert);
                    //         } else {
                    //             $scope.generateError(data.error, genAlert);
                    //         }
                    //     },
                    //     error: function (error) {
                    //         console.log(error);
                    //         //TODO
                    //     }
                    // });
                }, 500);
            }

            if ($scope.skinUser.length > 16) {// Possibly a UUID
                if ((/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test($scope.skinUser)) || (/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i.test($scope.skinUser))) {
                    skinUuid = $scope.skinUser;
                    generateUser(skinUuid);
                }
            } else {
                var validateAlert = $scope.addAlert("Validating Username...", "info", 10000);
                $.ajax({
                    url: apiBaseUrl + "/validate/user/" + $scope.skinUser + "?callback=?",
                    dataType: "jsonp",
                    success: function (data) {
                        if (data.valid) {
                            $scope.addAlert("Username is valid", "success", 1000);
                            skinUuid = data.uuid;
                            generateUser(skinUuid);
                        } else {
                            $scope.addAlert("Username is not valid", "danger", 10000);
                        }
                        validateAlert.close();
                    }
                });
            }
        }
    };
    $scope.generateSuccess = function (data, genAlert) {
        var successAlert = $scope.addAlert("Skin Generated!", "success", 10000);
        if (genAlert) {
            genAlert.close();
        }

        setTimeout(function () {
            successAlert.close();
            $location.path("/" + data.id);
        }, 1500);
    };
    $scope.generateError = function (message, genAlert) {
        $scope.addAlert("Failed to generate Skin: " + message, "danger", 10000);
        if (genAlert) {
            genAlert.close();
        }
    };

    $scope.generatorTimeout = 0;
    $scope.generatorDelay = 0;

    $scope.refreshTimeout = function () {
        $.ajax({
            url: apiBaseUrl + "/get/delay?callback=?",
            dataType: "jsonp",
            success: function (data) {
                $scope.generatorDelay = data.delay;
                $scope.generatorTimeout = data.nextRelative;
            }
        });
    };
}]);

mineskinApp.controller("galleryController", ["$scope", "$routeParams", "$location", "$http", function ($scope, $routeParams, $location, $http) {
    $scope.head.pageTitle = "Gallery | MineSkin";

    // To keep track of reloads (new-loads), since the pagination seems to reset the route-param back to its default value
    var newLoad = true;

    $scope.searchQuery = "";

    $scope.pagination = {
        page: 0,
        totalItems: 0,
        itemsPerPage: 28,
        maxSize: 4
    };
    $scope.skins = [];
    $scope.reloadGallery = function () {
        console.log("reload gallery #" + $scope.pagination.page);
        $scope.skins = [];
        $http({
            url: apiBaseUrl + "/get/list/" + $scope.pagination.page + "?size=" + $scope.pagination.itemsPerPage + ($scope.searchQuery ? "&filter=" + $scope.searchQuery : ""),
            method: "GET"
        }).then(function (response) {
            console.log(response);
            $scope.safeApply(function () {
                $scope.skins = response.data.skins;
                $scope.pagination.page = response.data.page.index;
                $scope.pagination.totalItems = response.data.page.totalSkins;
                newLoad = false;
            });
        });
    };
    $scope.galleryInit = function () {
        // Set page after init, so the pagination gets updated
        $scope.pagination.page = $routeParams.page;
        $scope.reloadGallery();
    };
    $scope.pageChanged = function () {
        if (!newLoad) {
            if ($routeParams.page !== $scope.pagination.page) {
                $location.update_path("/gallery/" + $scope.pagination.page);
            }
            $scope.reloadGallery();
        }
    };
}]);

mineskinApp.controller("viewController", ["$scope", "$routeParams", "$location", "$http", function ($scope, $routeParams, $location, $http) {
    $scope.skin = undefined;
    $http({
        url: apiBaseUrl + "/get/id/" + $routeParams.id,
        method: "GET"
    }).then(function (response) {
        $scope.safeApply(function () {
            $scope.skin = response.data;

            $scope.head.pageTitle = ($scope.skin.name || '#' + $scope.skin.id) + " | MineSkin";
            $scope.head.pageIcon = apiBaseUrl + "/render/" + $scope.skin.id + "/head";
        });
    });
}]);

mineskinApp.controller("skinController", ["$scope", "$timeout", "$location", "$http", function ($scope, $timeout, $location, $http) {
    /* +Alerts */
    $scope.alerts = [];
    $scope.addAlert = function (msg, type, timeout) {
        var newAlert = {type: type, msg: msg, timeout: timeout};
        $scope.safeApply(function () {
            $scope.alerts.push(newAlert);
        });
        return {
            alert: newAlert,
            close: function () {
                var index = $scope.alerts.indexOf(newAlert);
                if (index !== -1) {
                    $scope.closeAlert(index);
                }
            }
        }
    };
    $scope.closeAlert = function (index) {
        $scope.safeApply(function () {
            $scope.alerts.splice(index, 1);
        });
    };
    $scope.clearAlerts = function () {
        $scope.safeApply(function () {
            $scope.alerts.splice(0, $scope.alerts.length);
        });
    };
    /* -Alerts */

    /* +Head */
    $scope.head = {
        pageTitle: "MineSkin",
        pageIcon: "favicon.png",
        pageDescription: "Generate custom Minecraft Skins & Skulls from images"
    };
    /* -Head */

    /* +Stats */
    $scope.stats = {
        total: 0,
        unique: 0,
        duplicate: 0,
        private: 0,
        lastDay: 0,
        accounts: 0,
        delay: 0
    };
    $scope.refreshStats = function () {
        $http({
            url: apiBaseUrl + "/get/stats",
            method: "GET"
        }).then(function (response) {
            $scope.safeApply(function () {
                $scope.stats = response.data;
            });
        });
    };
    /* -Stats */

    $scope.navigateTo = function (path) {
        $location.path(path);
    };

    $scope.safeApply = function (fun) {
        // if (!$scope.$$phase) {
        //     $scope.$apply(fun);
        // }
        $timeout(fun);
    };
}]);
