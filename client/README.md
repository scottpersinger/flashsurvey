# Flash Survey AngularJS app

This is the Flash Survey app built with the AngularJS/Ionic framework. The 
app is written in Javascript. You can compile it into a native app with Apache
Cordova or serve it from the Node.js server.

## Viewing on the web

To make using the app from the web a little nicer, load the `web.html` page. This
puts the app inside an iframe with an aspect ration similar to a mobile device.

## App Structure

The app boots from index.html, which just loads the associated JS files. AngularJS
is loaded first, then js/app.js and so on. 

Each page of the app renders a template from the templates dir, and activates
a controller instanced defined in js/controllers.js.

## Communication with the server

All data storage happens through Ajax calls to the Node.js server. These calls use
the `$resource` library provided by Angular for making RESTful ajax calls.

