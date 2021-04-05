
'use strict'; //remember read.me

const express = require ('express');

const server = express();

require('dotenv').config(); //before PORT //to define env

const PORT = process.env.PORT || 3000;



const cors = require('cors');

server.use(cors());

//------------------------

server.get('/', (req,res) => {

  res.send('this is your home rout!');

  console.log('this is your home rout!');
});

//-------------------------------

server.get('/location', (req,res) => {

  // you only have one response for each request (one respone in get function)
  // res.send('location!');

  // load data from json file to variable (like ajax)
  let locationData = require('./data/location.json');

  let newLocation = new Location (locationData);

  res.send(newLocation);


});


const Location = function (oneLocation)
{
  this.search_query = 'Lynnwood';
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

server.get('/weather', (req,res) => {

  // you only have one response for each request (one respone in get function)
  // res.send('weather!');

  // load data from json file to variable (like ajax)
  let weatherData = require('./data/weather.json');

  // oneWeather = { '':'' , '':'' , ....}

  //weatherData = {'data':[], 'key':'pair' , 'key':'pair'}
  //weatherData.data = [{},{},{},.......]

  // res.send( weatherData.data );
  // console.log( weatherData.data );

  let allWeatherArr = [];
  weatherData.data.forEach(item => {
    allWeatherArr.push(new Weather (item));
  });

  res.send(allWeatherArr);

});


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


server.get('*',(req,res)=>{
  // res.status(404).send('wrong route')
  // {
  //     status: 500,
  //     responseText: "Sorry, something went wrong",
  //     ...
  //   }
  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status(500).send(errObj);
});

//--------------------

server.listen(PORT , () => {
  console.log('Listning...');
});
