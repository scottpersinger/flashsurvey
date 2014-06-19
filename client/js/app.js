angular.module('flashsurvey', ['ionic','flashsurvey.config','flashsurvey.controllers','flashsurvey.models',
                               'flashsurvey.services','flashsurvey.directives'])

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
    templateUrl: 'templates/survey_list.html',
    controller: 'SurveyListCtrl'
  })

  .state('survey', {
    url: '/survey/:sfid',
    templateUrl: 'templates/survey.html',
    controller: 'SurveyCtrl'
  })

  .state('login', {
    url:'/login',
    templateUrl:'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('register', {
    url:'/register',
    templateUrl:'templates/register.html',
    controller: 'RegisterCtrl'
  })


  $urlRouterProvider.otherwise('/');
})

// XMLHTTPRequest Interceptor.
// Outbound: Adds access token to HTTP requests before they are sent to the server.
// Inbound: Handles 401 (Not Authorized) errors by loading the Login page
.factory('AuthInterceptor', function ($rootScope, $window, $q, $location) {

    return {
        request: function (config) {
            $rootScope.loading = true;
            config.headers = config.headers || {};
            if ($window.localStorage.getItem('token')) {
                config.headers.authorization = $window.localStorage.getItem('token');
                try {
                  $rootScope.user = JSON.parse($window.localStorage.user);
                } catch (e) {
                  console.log(e);
                }
            }
            return config || $q.when(config);
        },
        requestError: function (request) {
            console.log('request error');
            $rootScope.loading = false;
            return $q.reject(request);
        },
        response: function (response) {
            $rootScope.loading = false;
            return response || $q.when(response);
        },
        responseError: function (response) {
            $rootScope.loading = false;
            if (response && response.status === 401) {
                // TODO: broadcast event instead.
                $location.path('/login');
            } else if (response && response.status !== 404) {
                alert(response.data);
            }
            return $q.reject(response);
        }
    };
})

// Add the AuthInterceptor declared above
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
})

