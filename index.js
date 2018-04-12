var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.dynamoDBTableName = 'WaterCheckDB'; // creates new table for userid:session.attributes

    alexa.registerHandlers(handlers);
    alexa.execute();
};


//Helper shorthands for multi modal compatability
const makePlainText = Alexa.utils.TextUtils.makePlainText;
const makeImage = Alexa.utils.ImageUtils.makeImage;
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const welcomeBackgroundImage = "https://s3.amazonaws.com/memodoring-images/WaterCheck_Welcome.png";


var handlers = {

    'NewSession': function() {
        // any previous session attributes are now loaded from Dynamo into the session attributes

        var todayNow = new Date();

        if(this.attributes['timestamp']) {  // user must have been here before
            var dateLast = new Date(this.attributes['timestamp']);
            var timeSpanMS = todayNow.getTime() - dateLast.getTime();
            var timeSpanMIN = Math.floor(timeSpanMS / (1000 * 60 ));
            var timeSpanHR = Math.floor(timeSpanMS / (1000 * 60 * 60));

            this.attributes['milisecondsSinceLast'] = timeSpanMS;
            this.attributes['hoursSinceLast'] = timeSpanHR;
            this.attributes['minutesSinceLast'] = timeSpanMIN;

            var launchCount = this.attributes['launchCount'];
            var lastSeenDay = dateLast.getDay();
            var currentDay = todayNow.getDay();
            //if(currentDay === 0 && lastSeenDay === 6)
            if(currentDay === lastSeenDay+1){
                this.attributes['launchCount'] = parseInt(launchCount) + 1;
            }

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
            this.response.speak('Welcome! We\'ll help you keep track of how much water you drink every day. Did you just drink some water?').listen('Did you just drink some water?'); //First welcome
            this.emit(":responseReady");
        }
        else{
            this.emit('LaunchRequest');
        }
    },

    'LaunchRequest': function () {  // happens when the user launches the skill but does not say their first question or command
        let outputSpeech = 'Welcome Back! Did you just drink some water?';
        let repromptSpeech = 'Did you just drink some water?';
        let hint = "Coffee is not water, Memo!"
        if(supportsDisplay.call(this)){ // Make Display
            //bodyTemplateMaker(pBodyTemplateType, pImg, pTitle, pText1, pText2, pOutputSpeech, pReprompt, pHint, pBackgroundIMG)
            //bodyTemplateMaker.call(this, 7, mainImage, 'Time to play ' + skillQuizName + '!', null, null, speechOutput, reprompt, null, mainImgBlurBG);
            let title = "Welcome to Water Check";
            bodyTemplateMaker.call(this, 6, welcomeBackgroundImage, title, "text 1", "text 2", outputSpeech, repromptSpeech, hint, welcomeBackgroundImage);


        }else{ // Audio only response
            //Composes text to be read out, and keeps session open
            this.response.speak(outputSpeech).listen(repromptSpeech);
            //All responses are sent to the Alexa service
            this.emit(":responseReady");
        }
    },

    'LogDrinkIntent': function () {
        /*
        TODO
        Add logic to increment the streak only after a drink on a day

        Define minimum number of drinks for streak to continue

        Check week+month to make sure streak wasn't interrupted

        Add array of responses for Logged drink confirmation

        Add Display Directives
        */

        var min = this.attributes['minutesSinceLast'];
        var launchCount = this.attributes['launchCount'];

        this.attributes['drinkCount'] = parseInt(this.attributes['drinkCount']) + 1;
        var drinkCount = this.attributes['drinkCount'];

        var speechOutput = "<say-as interpret-as='interjection'>way to go</say-as>. Logged it! <prosody rate='fast'>That's "+ drinkCount+ " drinks so far</prosody>";
        this.response.speak(speechOutput);

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
// Helper Functions
function randomPhrase(myData) {
    // the argument is an array [] of words or phrases

    var i = 0;

    i = Math.floor(Math.random() * myData.length);

    return(myData[i]);
}

function supportsDisplay() {
    var hasDisplay =
        this.event.context &&
        this.event.context.System &&
        this.event.context.System.device &&
        this.event.context.System.device.supportedInterfaces &&
        this.event.context.System.device.supportedInterfaces.Display

    return hasDisplay;
}


function bodyTemplateTypePicker(pNum) {
    var val;

    switch (pNum) {
        case 1:
            val = new Alexa.templateBuilders.BodyTemplate1Builder();
            break;
        case 2:
            val = new Alexa.templateBuilders.BodyTemplate2Builder();
            break;
        case 3:
            val = new Alexa.templateBuilders.BodyTemplate3Builder();
            break;
        case 6:
            val = new Alexa.templateBuilders.BodyTemplate6Builder();
            break;
        case 7:
            val = new Alexa.templateBuilders.BodyTemplate7Builder();
            break;
        default:
            val = null;
    }
    return val;
}

//Template makers
function bodyTemplateMaker(pBodyTemplateType, pImg, pTitle, pText1, pText2, pOutputSpeech, pReprompt, pHint, pBackgroundIMG) {
    var bodyTemplate = bodyTemplateTypePicker.call(this, pBodyTemplateType);
    var template = bodyTemplate.setTitle(pTitle)
        .build();

    if (pBodyTemplateType != 7) {
        //Text not supported in BodyTemplate7
        bodyTemplate.setTextContent(makeRichText(pText1) || null, makeRichText(pText2) || null) //Add text or null
    }

    if (pImg) {
        bodyTemplate.setImage(makeImage(pImg));
    }

    if (pBackgroundIMG) {
        bodyTemplate.setBackgroundImage(makeImage(pBackgroundIMG));
    }

    this.response.speak(pOutputSpeech)
        .renderTemplate(template)
        .shouldEndSession(null); //Keeps session open without pinging user..

    this.response.hint(pHint || null, "PlainText");
    this.attributes.lastOutputResponse = pOutputSpeech;

    if (pReprompt) {
        this.response.listen(pReprompt); // .. but we will ping them if we add a reprompt
    }

    this.emit(':responseReady');
}

function listTemplateTypePicker(pNum) {
    var val;

    switch (pNum) {
        case 1:
            val = new Alexa.templateBuilders.ListTemplate1Builder();
            break;
        case 2:
            val = new Alexa.templateBuilders.ListTemplate2Builder();
            break;
        default:
            val = null;
    }
    return val;
}

function listTemplateMaker(pArray, pType, pTitle, pOutputSpeech, pQuiz, pBackgroundIMG) {
    const listItemBuilder = new Alexa.templateBuilders.ListItemBuilder();
    var listTemplateBuilder = listTemplateTypePicker(pType);

    if (!pQuiz) {
        for (let i = 0; i < pArray.length; i++) {
            listItemBuilder.addItem(makeImage(pArray[i].imageURL), pArray[i].token, makePlainText(capitalizeFirstLetter(pArray[i].name)));
        }
    } else {
        //Dont insert option name if playing the quiz ()
        for (let i = 0; i < pArray.length; i++) {
            listItemBuilder.addItem(makeImage(pArray[i].imageURL), pArray[i].token);
        }
    }

    var listItems = listItemBuilder.build();
    var listTemplate = listTemplateBuilder.setTitle(pTitle)
        .setListItems(listItems)
        .build();

    if (pBackgroundIMG) {
        listTemplateBuilder.setBackgroundImage(makeImage(pBackgroundIMG));
    }

    this.attributes.lastOutputResponse = pOutputSpeech;

    this.response.speak(pOutputSpeech)
        .renderTemplate(listTemplate)
        .shouldEndSession(null);
    this.emit(':responseReady');
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
