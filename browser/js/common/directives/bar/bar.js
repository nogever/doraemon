'use strict';
app.directive('lsBar', function () {

    return {
        restrict: 'A',
        templateUrl: 'js/common/directives/bar/bar.html',
        scope: {
            height: '=',
            diff: '='
        },
        link: function (scope, element, attrs) {
        	// console.log(scope.height);
            element.css('height', scope.height * 100 + 'px');
            element.addClass('ls-bar');
            // element.append('<p>' + scope.dif.websiteUrl + '</p>');
        }
    };

});