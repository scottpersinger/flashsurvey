angular.module('flashsurvey.controllers', ['ionic'])

.controller('SurveyListCtrl', function($scope, Survey) {
	$scope.surveys = Survey.query();
})

.controller('SurveyCtrl', function($scope, $stateParams, $timeout, Survey, Question, SurveyResponse, QuestionResponse) {
	$scope.survey = Survey.get({sfid: $stateParams.sfid});
	$scope.questions = Question.query(function() {
		$scope.active = $scope.questions[0].sfid;
	});
	$scope.finished = false;
	$scope.goNext = function(sfid) {
		for (var i = 0; i < $scope.questions.length; i++) {
			if ($scope.questions[i].sfid == sfid) {
				if (i < ($scope.questions.length-1)) {
					$scope.active = $scope.questions[i+1].sfid;
				} else {
					$scope.finished = true;
					$scope.active = '';
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
		response.name = "Scott";
		response.$save(function(parent) {
			var qresp = [];
			$scope.questions.forEach(function(q) {
				var res = new QuestionResponse({ flashsurveyquestion__c: q.sfid });
				res.name = q.question__c;
				var k = (q.answer.choice == true || q.answer.choice == false) ? 
					'booleanresponse__c' : 'textresponse__c';
				res[k] = q.answer.choice;
				res.flashsurveyresponse_external_id = parent.id;
				res.$save();
			});
			$scope.finished = true;
			$scope.active = '';
		})
	}
})
