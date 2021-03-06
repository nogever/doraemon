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
    $rootScope.stateClass = 'dashboard';
    $scope.allDiffsByUser = allDiffsByUser;
    $scope.uniqueTestsByUser = Dashboard.getUniqueTests(allTestsByUser);
    $scope.toggleCheckbox = Utils.toggleCheckbox;
    $scope.today = MathUtils.formatDate(new Date());
    $scope.diffsForUser = null;
    $scope.diffsForUserByTest = null;
    $scope.testsByDate = null;
    $scope.initialSelect = true;
    // search params for test name
    $scope.searchParams = {
        user: currentUser._id,
        testName: 'Select a Test'   
    };
    // display diff images by test name
    $scope.diffImages = {
        byUrl: Dashboard.displayByURL($scope.allDiffsByUser),
        byDate: Dashboard.displayByDate($scope.allDiffsByUser, MathUtils),
        byViewport: Dashboard.displayByViewport($scope.allDiffsByUser)
    };
    if ($scope.diffImages.byDate[0] !== undefined && $scope.diffImages.byDate[0].date == $scope.today) {
        $scope.diffsToday = $scope.diffImages.byDate[0].percObjArr;
        $scope.diffsTest = $scope.diffImages.byDate[0].percObjArr;
    }
    // display dashboard stats
    $scope.dashboard = {
        alertNum: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).alertsToday,
        alertNumTotal: Dashboard.getTotalAlerts($scope.allDiffsByUser),
        testsNum: Dashboard.getTestsToday($scope.allDiffsByUser, MathUtils),
        testsNumTotal: allDiffsByUser.length,
        diffPercent: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).diffPercentToday,
        alertNumOneTest: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).alertsToday,
        testsNumOneTest: Dashboard.getTestsToday($scope.allDiffsByUser, MathUtils),
        diffPercentOneTest: Dashboard.getStatsToday($scope.diffImages.byDate, MathUtils).diffPercentToday
    };
    // update dashboard by selecting test name
    $scope.updateDashboard = function () {
        $scope.initialSelect = false;
        Dashboard.searchDiffsByTest($scope.searchParams)
        .then(function (diffs) {
            $scope.diffImages.byUrl = Dashboard.displayByURL(diffs);
            $scope.diffImages.byDate = Dashboard.displayByDate(diffs, MathUtils);
            $scope.diffImages.byViewport = Dashboard.displayByViewport(diffs);
            $scope.dashboard.alertNumOneTest = Dashboard.getStatsOneTest(diffs, MathUtils).alerts;
            $scope.dashboard.testsNumOneTest = diffs.length;
            $scope.dashboard.diffPercentOneTest = Dashboard.getStatsOneTest(diffs, MathUtils).diffPerc;
            $scope.diffsTest = Dashboard.getStatsOneTest(diffs, MathUtils).percObjArr;
        })
        .catch(console.log);
    };
    // diff image modal
    $scope.openDiffModal = Modal.openModal;
});

app.controller('DiffModalCtrl', function ($http, $scope, $modalInstance, viewDiff) {
    
    $scope.diffInfo = viewDiff;
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

























