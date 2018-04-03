var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.dynamoDBTableName = 'WaterCheckDB'; // creates new table for userid:session.attributes

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {

    'NewSession': function() {
        // any previous session attributes are now loaded from Dynamo into the session attributes

        var todayNow = new Date();

        if(this.attributes['timestamp']) {  // user must have been here before
            var dateLast = new Date(this.attributes['timestamp']);
            var timeSpanMS = todayNow.getTime() - dateLast.getTime();
            var timeSpanHR = Math.floor(timeSpanMS / (1000 * 60 * 60));
            var timeSpanMIN = Math.floor(timeSpanMS / (1000 * 60 ));

            this.attributes['milisecondsSinceLast'] = timeSpanMS;
            this.attributes['hoursSinceLast'] = timeSpanHR;
            this.attributes['minutesSinceLast'] = timeSpanMIN;

            var launchCount = this.attributes['launchCount'];
            this.attributes['launchCount'] = parseInt(launchCount) + 1;

        } else {  // first use
            this.attributes['milisecondsSinceLast'] = 0;
            this.attributes['hoursSinceLast'] = 0;
            this.attributes['minutesSinceLast'] = 0;
            this.attributes['launchCount'] = 1;
            this.attributes['drinkCount'] = 0;
        }


        //this.attributes['timestamp'] = todayNow;
        this.attributes['timestamp'] = todayNow.toString();

        console.log('~~~~~~~~~NewSession~~~~~~~~~');
        console.log(JSON.stringify(this.attributes));
        console.log('~~~~~~~~~~~~~~~~~~');

        if(!this.attributes['drinkCount']){
            this.response.speak('Welcome! We`ll help you keep track of how much water you drink every day. Did you just drink some water?').listen('Did you just drink some water?');
            this.emit(":responseReady");
        }
        else{
            this.emit('LogDrinkIntent');
        }
    },

    'LaunchRequest': function () {  // happens when the user launches the skill but does not say their first question or command
        this.emit('LogDrinkIntent');
    },

    'LogDrinkIntent': function () {

        var min = this.attributes['minutesSinceLast'];
        var launchCount = this.attributes['launchCount'];

        this.attributes['drinkCount'] = parseInt(this.attributes['drinkCount']) + 1;
        var drinkCount = this.attributes['drinkCount'];

        var speechOutput = "Congrats. Logged it! That's "+ drinkCount+ " drinks so far";
        this.response.speak(speechOutput);

                //Congrats. Logged it. that's two today, your streak is X days in a row

        //this.response.speak(' what can I help you with?').listen('try again');
        console.log('~~~~~~~~~LogDrinkIntent~~~~~~~~~');
        console.log(JSON.stringify(this.attributes));
        console.log('~~~~~~~~~~~~~~~~~~');
        //this.attributes['timestamp']= "2018-04-03T23:26:14.705Z";
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        this.response.speak('We will help ypou keep track of your water intake, just let us know when you drink. Have you had water recently?').listen('Have you had water?');
        this.emit(':responseReady');

    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('goodbye');
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function () {
        console.log('~~~~~~~~~YES Intent~~~~~~~~~');
        console.log(JSON.stringify(this.attributes));
        console.log('~~~~~~~~~~~~~~~~~~');
        this.emit('LogDrinkIntent');
    },
    'AMAZON.NoIntent': function () {
        this.response.speak('OK, goodbye');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('goodbye, ');
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function(){
        console.log('~~~~~~~~~Session Ended~~~~~~~~~');
        console.log(JSON.stringify(this.attributes));
        console.log('~~~~~~~~~~~~~~~~~~');
    }
};

function randomPhrase(myData) {
    // the argument is an array [] of words or phrases

    var i = 0;

    i = Math.floor(Math.random() * myData.length);

    return(myData[i]);
}
