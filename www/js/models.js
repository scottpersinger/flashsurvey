angular.module('flashsurvey.models', ['ngResource', 'flashsurvey.config'])
	.factory('Survey', function ($resource, HOST) {
        return $resource(HOST + 'flashsurvey__c/:sfid');
    })
	.factory('Question', function ($resource, HOST) {
        return $resource(HOST + 'flashsurveyquestion__c/:sfid');
    })
    .factory('SurveyResponse', function ($resource, HOST) {
        return $resource(HOST + 'flashsurveyresponse__c/:sfid');
    })
    .factory('QuestionResponse', function ($resource, HOST) {
        return $resource(HOST + 'flashquestionresponse__c/:sfid');
    })

