angular.module('flashsurvey.directives', [])
.directive('surveyQuestion', function($compile) {
  var header = '<div class="survey-question reveal-animation">' +
               '<div class="page-number">{{$parent.$index+1}} of {{$parent.$parent.questions.length}}</div>',

      footer = '</div',

      qTempl = '<div class="qtext">{{content.question__c}}</div>',

      templates = {
        Picklist: qTempl +
                  '<ion-radio name = "pref" ng-repeat="choice in content.picklist" ' + 
                      'ng-value="choice" ng-model="content.answer.choice"> ' +
                      '{{ choice }}' +
                  '</ion-radio>',
        Boolean: qTempl + 
                 'No <label class="toggle toggle-positive">' +
                 '<input type="checkbox" ng-model="content.answer.choice" /> ' +
                 '<div class="track"> ' +
                 '<div class="handle"></div> ' +
                 '</div> ' +
                 '</label> Yes',
        'Free text': qTempl + 
                     '<textarea class="comment" rows="4" ng-model="content.answer.choice"></textarea>',
      },

      default_values = {
        Picklist: '',
        Boolean: false,
        Number: null,
        'Free text': ''
      },


      prevButton =  '<button class="button button-balanced ng-hide" ng-show="!$parent.$first" ' + 
                    'ng-click="$parent.goPrev(content.sfid)">&laquo; Back</button>',

      nextButton =  '<button class="button button-balanced pull-right ng-hide" ' + 
                    'ng-show="!$parent.$last" ng-click="$parent.goNext(content.sfid)">Next &raquo;</button>',

      buttonsPre = '<div class="bar bar-footer">',

      finishButton ='<button class="button button-positive ng-hide" ng-click="$parent.submit(content.sfid)" ' +
                    'ng-show="$parent.$last"' +
                    '>Finish</button>',

      buttons = buttonsPre + prevButton + nextButton + finishButton + '</div';

  var linker = function(scope, element, attrs) {
        scope.content.answer = {choice: default_values[scope.content.answertype__c]};
        var template =  header + 
                        (templates[scope.content.answertype__c] || qTempl) +
                        buttons +
                        footer;
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
