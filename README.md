Flash Surveys is a simple survey app demonstrating the use of Heroku Connect to deploy
a mobile app on Heroku which is integrated with Force.com.

## How to use the app

Surveys are created in force.com. Heroku Connect will sync each survey to the Postgres
DB where it becomes available to the app.

Run the Node.js server:

    npm install
    node server/main.js

Open the app:

    http://localhost:3000

Register with an email address and password, then login with same.

Tap a survey, then you can complete the survey. At the end your reponses are saved
to the db where they are sync'd back to force.com.

Open the FlashSurveys tab in force.com to review the responses.

## Installation

### Force.com

Install the Flash Surveys Force.com package into your Force.com account:

  https://login.salesforce.com/packaging/installPackage.apexp?p0=04tG0000000LEhC

In Salesforce, open the `Flash Surveys` tab. Create a new survey. Now add questions
to your survey. For each question you can pick the type of response to require.
You should set the "Order" value on each question to control the order in which
they appear.

### Clone the Flash Survey Node.js app

You need `NPM` installed on your system. Install it from here:

    $ npm install loc

Now clone the Flash Survey Node.js app:

- Pick a name for your Heroku app, like "flashsurvey-scottp":

    $ npm install -g app.json
    $ app.json clone https://github.com/heroku/flashsurvey.git flashsurvey-scottp

It can take a few minutes for the app to finish cloning. Check "heroku logs" to see
if Node has started. Once it has you can open the app:

    $ cd flashsurvey-app
    $ heroku open



 
### Deploy the Flash Survey app on Heroku

Create a Heroku app


## Structure of this app

The app contains a Node.js server component in `server`, and an AngularJS/Ionic
front-end in `client`. 

The Node app will both serve the static assets the Angular client as well as handle
Ajax requests to interacting with the database.

## File structure

    client/            AngularJS app
      index.html       Main app page
      web.html         Desktop browser frame

    server/     Node.js backend
      main.js          Express app



