
'use strict';


//NOTE: all //-------------lab03 comments : DATATBASE SETUP

//DOTENV (read our enviroment variable)
require('dotenv').config();


// Application Dependencies
const express = require ('express');

//CORS = Cross Origin Resource Sharing
const cors = require('cors');

//Postges
const pg = require('pg'); //--------------lab03
// npm i pg  //-------------lab03

// client-side HTTP request library
const superagent = require('superagent'); // nmp i superagent

// Application Setup
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());

//to turn express server into pg client
// DATABASE_URL used to make express reach spicific
// database with this url
// DATABASE_URL should be writtin exactly like that
// to mach heroku
//DATABASE_URL=postgresql://furatmalkawi:12345@localhost:5432/class8
//localhost:5432/class8 --> 5432 reserved port for postgress local server
//class8 --> name of database
// env: environment variable
const client = new pg.Client(process.env.DATABASE_URL); //-------------lab03


// Routes
server.get('/', homeRoutHandler );
server.get('/location', locationRoutHandler);
server.get('/weather', weatherRoutHandler);
server.get('/parks', parkRoutHandler);
server.get('*', allRoutHandler);



//Functions
function homeRoutHandler (req,res) {

  res.send('this is your home rout!');
  console.log('this is your home rout!'); }

//---------------------------
//http://localhost:3000/location?city=amman
function locationRoutHandler (req,res) {
  ////////////////// Lab01 - json data /require() ////////////////////////
  // let locationData = require('./data/location.json');

  ////////////////// Lab02 - api data ////////////////////////

  // get data from api server (locationIQ)
  // send a request using superagent library


  ////////////////// Lab03 - api data ////////////////////////


  let cityName = req.query.city;

  let key = process.env.LOCATION_KEY;
  let LocURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  superagent.get(LocURL) //send request to LocationIQ API
    .then(fullLocationData => {
      // console.log(fullLocationData.body);
      let locationData = fullLocationData.body;
      const locationObjArr = new Location(cityName, locationData);
      res.send(locationObjArr);
    });

}

//--------------------------
//http://localhost:4000/weather?search_query=amman&formatted_query=Amman%2C%2011181%2C%20Jordan&latitude=31.9515694&longitude=35.9239625&page=1/http://localhost:3000/location?city=amman


function weatherRoutHandler (req,res) {

  // console.log(req.query);
  // let cityName = req.query.city;

  //days = integer // optional
  //https://api.weatherbit.io/v2.0/forecast/daily?city=amman&&days=5&key=d511f93364224b66948337601100cede`
  let key = process.env.WEATHER_KEY;


  // let cityName = req.query.search_query;
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  // let cityFormat = req.query.formatted_query;
  let weathURL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=5&key=${key}`;
  // let weathURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&days=5&key=${key}`;

  superagent.get(weathURL) //send request to LocationIQ API
    .then(fullWeatherData => {
      // console.log(fullWeatherData);

      let weatherData = fullWeatherData.body.data;
      //console.log(weatherData);

      let weatherObjArr = weatherData.map(item => {
        return new Weather (item); });

      res.send(weatherObjArr);
      // }

    });
  // res.send(weatherObjArr);
  // if we put here it will be excuted before object is filled

}

//---------------------------

// Request URL: http://localhost:4000/parks?search_query=furat&formatted_query=El%20Furat%2C%20Al%20Qurna%2C%20Al-Qurnah%20Central%20Sbudsitrict%2C%20Al-Qurnah%20District%2C%20Al-Basra%20Governorate%2C%20Iraq&latitude=30.99839&longitude=47.414271&page=1
function parkRoutHandler (req,res) {


  let searchQuery = req.query.search_query;

  let key = process.env.PARK_KEY;

  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${searchQuery}&limit=10&api_key=${key}`;

  //https://developer.nps.gov/api/v1/parks?q=washington&limit=10&api_key=mCl00CGas8FE1Gdab18jbFtkTqCxXgxhN9HmLn1x

  superagent.get(parkURL) //send request to LocationIQ API
    .then(fullParkData => {

      let parkData = fullParkData.body.data;
      console.log(parkData);

      let parkObjArr = parkData.map(item => {
        return new Park (item); });


      res.send(parkObjArr);

      // }

    });
  // res.send(weatherObjArr);
  // if we put here it will be excuted before object is filled

}
//--------------------------

function allRoutHandler (req,res) {
  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status(500).send(errObj);
}

//---------------------


//Constructor

const Location = function (cityName,oneLocation)
{
  this.search_query = cityName;
  this.formatted_query = oneLocation[0].display_name;
  this.latitude = oneLocation[0].lat;
  this.longitude = oneLocation[0].lon;


  // {
  //   "search_query": "seattle",
  //   "formatted_query": "Seattle, WA, USA",
  //   "latitude": "47.606210",
  //   "longitude": "-122.332071"
  // }
};


//-------------------------------


const Weather = function (oneWeather)
{
  this.forecast = oneWeather.weather.description;
  this.time = new Date(oneWeather.valid_date).toDateString();


  // response should look like:
  // [
  //   {
  //     "forecast": "Partly cloudy until afternoon.",
  //     "time": "Mon Jan 01 2001"
  //   },
  //   {
  //     "forecast": "Mostly cloudy in the morning.",
  //     "time": "Tue Jan 02 2001"
  //   },
  //   ...
  // ]
};



//-------------------------------


const Park = function (onePark)
{
  this.name =onePark.fullName;
  this.address = `${onePark.addresses[0].line1}, ${onePark.addresses[0].city}, ${onePark.addresses[0].stateCode} ${onePark.addresses[0].postalCode}`;
  this.fee = onePark.entranceFees[0].cost;
  this.description = onePark.description;
  this.url = onePark.url;
  // response should look like:

  // [
  //   {
  //    "name": "Klondike Gold Rush - Seattle Unit National Historical Park",
  //    "address": "319 Second Ave S., Seattle, WA 98104",
  //    "fee": "0.00",
  //    "description": "Seattle flourished during and after the Klondike Gold Rush. Merchants supplied people from around the world passing through this port city on their way to a remarkable adventure in Alaska. Today, the park is your gateway to learn about the Klondike Gold Rush, explore the area's public lands, and engage with the local community.",
  //    "url": "https://www.nps.gov/klse/index.htm"
  //   },
  // ]
};

//Server Listner
client.connect() //--------------------lab03
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });

//connect express server to postgres server
// only when done (connection worked!) ---->
// prepare express to listen to browser requests