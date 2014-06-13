// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('flashsurvey', ['ionic','flashsurvey.config','flashsurvey.controllers','flashsurvey.models'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('index', {
    url: '/',
    templateUrl: 'survey_list.html',
    controller: 'SurveyListCtrl'
  })

  .state('survey', {
    url: '/survey/:sfid',
    templateUrl: 'survey.html',
    controller: 'SurveyCtrl'
  })

  $urlRouterProvider.otherwise('/');
})

.directive('surveyQuestion', function($compile) {
  var header = '<div class="page-number">{{$parent.$index+1}} of {{$parent.$parent.questions.length}}</div>';
  var qTempl = '<div class="qtext">{{content.question__c}}</div>';
  var templates = {
    Picklist2: qTempl +
              '<select ng-model="content.answer.choice" ng-options="item for item in content.picklist"></select>',
    Picklist: qTempl +
                '<ion-radio name = "pref" ng-repeat="choice in content.picklist" ' + 
                    'ng-value="choice" ng-model="content.answer.choice"> ' +
                    '{{ choice }}' +
                '</ion-radio>',
    Picklist_default: '',
    Boolean: qTempl + 
            'No <label class="toggle toggle-positive"> \
            <input type="checkbox" ng-model="content.answer.choice" /> \
            <div class="track"> \
            <div class="handle"></div> \
            </div> \
            </label> Yes',
    Boolean_default: false,
    Text: qTempl + '<textarea rows="4" ng-model="content.answer.choice"></textarea>',
    Text_default: ''
  };
  var prevButton = 
                '<button class="button button-balanced ng-hide" ng-show="!$parent.$first" ' + 
                'ng-click="$parent.goPrev(content.sfid)">&laquo; Back</button>';
  var nextButton = 
                '<button class="button button-balanced pull-right ng-hide" ' + 
                'ng-show="!$parent.$last" ng-click="$parent.goNext(content.sfid)">Next &raquo;</button>';
  var buttonsPre = '<div class="bar bar-footer">';
  var finishButton = 
                '<button class="button button-positive ng-hide" ng-click="$parent.submit(content.sfid)" ' +
                'ng-show="$parent.$last"' +
                '>Finish</button>';
  var buttons = buttonsPre + prevButton + nextButton + finishButton + '</div';

  var linker = function(scope, element, attrs) {
        // DO SOMETHING
        scope.content.answer = {choice: templates[scope.content.answertype__c + '_default']};
        var template = '<div class="survey-question reveal-animation">' + 
                        header + 
                        (templates[scope.content.answertype__c] || qTempl);
        template += buttons;
        template += '</div';
        if (scope.content.choices__c) {
          scope.content.picklist = scope.content.choices__c.split("\n");
        }
        element.html(template);
        $compile(element.contents())(scope);
  }

  return {
      restrict: "E",
      replace: true,
      link: linker,
      scope: {
          content:'='
      }
  };  
})
