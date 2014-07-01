angular.module('flashsurvey.controllers', ['ionic'])

.controller('LoginCtrl', function($scope, $http, $state, $rootScope, $window, $ionicPopup, $ionicNavBarDelegate, HOST) {
	$scope.user = {email: '', password: ''};

	$scope.login = function() {
		$http.post(HOST + 'login', $scope.user)
			.success(function (data) {
                $rootScope.user = data.user;
                $window.localStorage.user = JSON.stringify(data.user);
                $window.localStorage.token = data.token;
                $ionicNavBarDelegate.back();
            })
            .error(function(err) {
            	$ionicPopup.alert({title:"Login Error", template: err});
            });
	}
})

.controller('RegisterCtrl', function($scope, $rootScope, $http, $window, $ionicNavBarDelegate, HOST) {
	$scope.user = {email: '', password: ''};

	$scope.register = function() {
		$http.post(HOST + 'register', $scope.user)
			.success(function (data) {
                $rootScope.user = data.user;
                $window.localStorage.user = JSON.stringify(data.user);
                $window.localStorage.token = data.token;
                $ionicNavBarDelegate.back();
            });
	}

})

.controller('SurveyListCtrl', function($scope, $state, $http, $rootScope, $window, $ionicViewService, Survey, HOST) {
	$scope.surveys = Survey.query();

	$scope.logout = function() {
        $rootScope.user = null;
        $window.localStorage.clear();

        var promise = $http.post(HOST + 'logout');
        $window.localStorage.clear();
        $ionicViewService.clearHistory()
        $state.go('index', null, {reload:true});
        return promise;
	}
})

.controller('SurveyCtrl', function($rootScope, $scope, $stateParams, $timeout, 
								   Survey, Question, SurveyResponse, QuestionResponse, guid) {
	$scope.survey = Survey.get({sfid: $stateParams.sfid});
	$scope.questions = Question.query({flashsurvey__c: $stateParams.sfid}, function() {
		$scope.active = $scope.questions[0].sfid;
	});
	$scope.finished = false;

	$scope.goNext = function(sfid) {
		for (var i = 0; i < $scope.questions.length; i++) {
			if ($scope.questions[i].sfid == sfid) {
				if (i < ($scope.questions.length-1)) {
					$scope.active = $scope.questions[i+1].sfid;
				}
				break;
			}
		}
	}

	$scope.goPrev = function(sfid) {
		for (var i = $scope.questions.length-1; i >= 0; i--) {
			if ($scope.questions[i].sfid == sfid) {
				if (i > 0) {
					$scope.active = $scope.questions[i-1].sfid;
				}
				break;
			}
		}
	}

	$scope.submit = function() {
		// Answers are annotated in the 'answer' attr in each question
		var response = new SurveyResponse();
		response.name = $rootScope.user.email;
		response.contact__external_id__c = $rootScope.user.email;
		response.flashsurvey__c = $scope.survey.sfid;
		response.external_id__c = guid();
		response.$save(function(parent) {
			var qresp = [];
			$scope.questions.forEach(function(q) {
				var res = new QuestionResponse({ flashsurveyquestion__c: q.sfid });
				res.name = q.question__c;
				var k = (q.answer.choice == true || q.answer.choice == false) ? 
					'booleanresponse__c' : 'textresponse__c';
				res[k] = q.answer.choice;
				res.flashsurveyresponse__c__external_id__c = response.external_id__c;
				res.$save();
			});
			$scope.finished = true;
			$scope.active = '';
		})
	}
})

