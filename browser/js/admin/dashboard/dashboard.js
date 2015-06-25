'use strict';
app.config(function ($stateProvider) {

    $stateProvider.state('admin.dashboard', {
        url: '/dashboard',
        templateUrl: 'js/admin/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
            currentUser: function(AuthService) {
                return AuthService.getLoggedInUser()
                            .catch(function (err) {
                                console.log(err);
                            });
            },
            allDiffsByUser: ['currentUser', 'Dashboard', function(currentUser, Dashboard) {
                return Dashboard.allDiffsByUser(currentUser._id)
                            .catch(function (err) {
                                console.log(err);
                            });
            }],
            allTestsByUser: ['currentUser', 'Dashboard', function(currentUser, Dashboard) {
                return Dashboard.getTestsByUserID(currentUser._id)
                            .catch(function (err) {
                                console.log(err);
                            });
            }]
        }
    });

});

app.controller('DashboardCtrl', function ($scope, MathUtils, Utils, Dashboard, Modal, $modal, currentUser, allDiffsByUser, allTestsByUser, $rootScope) {
    $scope.diffsToday = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    $scope.diffsTest = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    $rootScope.stateClass = 'dashboard';
    $scope.allDiffsByUser = allDiffsByUser;
    $scope.uniqueTestsByUser = Dashboard.getUniqueTests(allTestsByUser);
    $scope.toggleCheckbox = Utils.toggleCheckbox;
    $scope.diffsForUser = null;
    $scope.diffsForUserByTest = null;
    $scope.testsByDate = null;
    // search params for test name
    $scope.searchParams = {
        user: currentUser._id,
        testName: 'DramaFever1'    
    };
    // display diff images by test name
    $scope.diffImages = {
        byUrl: Dashboard.displayByURL($scope.allDiffsByUser),
        byDate: Dashboard.displayByDate($scope.allDiffsByUser, MathUtils),
        byViewport: Dashboard.displayByViewport($scope.allDiffsByUser)
    };
    // display dashboard stats
    $scope.dashboard = {
        alertNum: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).alertsToday,
        testsNum: Dashboard.getTestsToday($scope.allDiffsByUser, MathUtils),
        diffPercent: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).diffPercentToday,
        alertNumOneTest: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).alertsToday,
        testsNumOneTest: Dashboard.getTestsToday($scope.allDiffsByUser, MathUtils),
        diffPercentOneTest: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).diffPercentToday,
    };
    // update dashboard by selecting test name
    $scope.updateDashboard = function () {
        Dashboard.searchDiffsByTest($scope.searchParams)
            .then(function (diffs) {
                $scope.diffImages.byUrl = Dashboard.displayByURL(diffs);
                $scope.diffImages.byDate = Dashboard.displayByDate(diffs, MathUtils);
                $scope.diffImages.byViewport = Dashboard.displayByViewport(diffs);
                $scope.dashboard.alertNumOneTest = Dashboard.getStatsOneTest(diffs, MathUtils).alerts;
                $scope.dashboard.testsNumOneTest = diffs.length;
                $scope.dashboard.diffPercentOneTest = Dashboard.getStatsOneTest(diffs, MathUtils).diffPerc;
            })
            .catch(console.log);
        };
    // diff image modal
    $scope.openDiffModal = Modal.openModal;

    // test chart.js
    // $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
    // $scope.series = ['Series A', 'Series B'];
    // $scope.data = [
    // [65, 59, 80, 81, 56, 55, 40],
    // [28, 48, 40, 19, 86, 27, 90]
    // ];
    // $scope.onClick = function (points, evt) {
    //     console.log(points, evt);
    // };
});

app.controller('DiffModalCtrl', function ($http, $scope, $modalInstance, viewDiff) {
    
    $scope.diffInfo = viewDiff;
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

























