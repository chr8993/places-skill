![alt tag](https://res.cloudinary.com/cinemate/image/upload/w_150/places_large_vuwqbh.png)
# Alexa Places Skill
The Places skill is meant to simplify the available information about a specific location. Places can help you find where a location may be and offers directions that are sent to your phone!

Simply by asking "Alexa, ask places for directions to Starbucks" you can receive accurate directions sent to your phone. You can also ask for general information about a location like the hours of operations and phone number by asking "Alexa, ask places what is the phone number for Pizza Hut" or "Alexa, ask places is Walmart is still open"

## Installation
You can utilize the Places skill by running the following:

`git clone https://github.com/chr8993/places-skill.git`

`cd ./places-skill && gulp`

This will generate a zip file in the dist folder that you will need to upload to Amazon Web Services Lambda using the alexa-skills-kit-color-expert blueprint. In order for persisted location information you must enable permission for AWS Lambda to write/create tables in DynamoDB.

## Configuration
In order for the external APIs to work properly you must replace any neccessary API keys to your own. The following files must be modified:

`\\index.js line 7`

`var key         = "GOOGLE_API_KEY"; // your google api key`

`\\index.js line 247`

`var appId = "ALEXA_APP_ID"; //your app ID`

`\\places.js line 4`

`var key = "GOOGLE_API_KEY" //your google api key`
