![alt tag](https://res.cloudinary.com/cinemate/image/upload/w_150/places_large_vuwqbh.png)
# Alexa Places Skill
The Places skill is meant to simplify the available information about a specific location. Places can help you find where a location may be and offers directions that are sent to your phone!

Simply by asking "Alexa, ask places for directions to Starbucks" you can receive accurate directions sent to your phone. You can also ask for general information about a location like the hours of operations and phone number by asking "Alexa, ask places what is the phone number for Pizza Hut" or "Alexa, ask places is Walmart is still open"

## Installation
You can utilize the Places skill by running the following:

`git clone https://github.com/chr8993/places-skill.git`

`cd ./places-skill && npm install && gulp`

This will generate a zip file in the dist folder that you will need to upload to Amazon Web Services Lambda using the alexa-skills-kit-color-expert blueprint. In order for persisted location information you must enable permission for AWS Lambda to write/create tables in DynamoDB.

## Configuration
In order for the external APIs to work properly you must replace any neccessary API keys to your own. The following files must be modified:

`\\index.js line 7`

`var key         = "GOOGLE_API_KEY"; // your google api key`

`\\index.js line 335`

`var appId = "ALEXA_APP_ID"; //your app ID`

`\\places.js line 5`

`var key = "GOOGLE_API_KEY" //your google api key`

### DynamoDb Permissions
In order to allow for storage of a user's location, you must update the permissions to allow full access to create the neccessary `alexaStorage` table. You can do this by attaching the `AmazonDynamoDBFullAccess` policy to the role you selected for the Lambda function.

1.) Head over to: [IAM Console](https://console.aws.amazon.com/iam/home#roles)

2.) Select the role you attached to the Lambda function in the table displayed.

3.) Attach the `AmazonDynamoDBFullAccess` policy


![IAM Console Screen](http://res.cloudinary.com/cinemate/image/upload/udpate_policy_le089u.jpg)
