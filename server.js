
'use strict';


//NOTE: //-------------lab03 comments : are for DATATBASE SETUP code

//DOTENV (read our enviroment variable)
require('dotenv').config();


// Application Dependencies -------------------------------------------------------------:
const express = require ('express'); // npm i express

//CORS = Cross Origin Resource Sharing
const cors = require('cors'); // npm i cors

//Postges
const pg = require('pg'); //--------------lab03
// npm i pg


// client-side HTTP request library
const superagent = require('superagent'); // nmp i superagent

//yelp -----
const yelp = require('yelp-fusion'); // nmp i yelp-fusion


// Application Setup --------------------------------------------------------------------:
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());

//--------- to turn express server into pg client :
// DATABASE_URL used to make express reach spicific database with this url
// DATABASE_URL should be named exactly like that
// to mach heroku
//DATABASE_URL=postgresql://furatmalkawi:12345@localhost:5432/class8
//localhost:5432 --> 5432 reserved port for postgress local server
//class8 --> name of database
// env: environment variable

// to run locally:
const client = new pg.Client(process.env.DATABASE_URL); //-------------lab03

//to run on heroku:
// const client = new pg.Client( { connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); //-------------lab03


// Routes
server.get('/', homeRoutHandler );
server.get('/location', locationRoutHandler);
server.get('/weather', weatherRoutHandler);
server.get('/parks', parkRoutHandler);
server.get('/movies', movieRoutHandler);
server.get('/yelp', yelpRoutHandler);
server.get('*', allRoutHandler);


//Functions---------------------------------------------------------------
function homeRoutHandler (req,res) {

  res.send('this is your home rout!');
  console.log('this is your home rout!'); }

//----------------------------------------------------------
//http://localhost:3000/location?city=amman
function locationRoutHandler (req,res) {

  ////////////////// Lab03 - api data ////////////////////////

  let cityName = req.query.city; //'amman'

  // API data
  let key = process.env.LOCATION_KEY;
  let LocURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  // check if i have 'amman' in data base?
  checkDatabase(res,cityName,LocURL);
}

//--------------------------------

function checkDatabase (res,cityName,URL)
{
  console.log(`/////////////////////////////NEW City Explore//////////////////////////////////`);
  console.log(`checking ${cityName} in database Table...`);

  // results.rows --> array of table data records
  // [{},{},....]

  //result ---> {%$$$$%@ ...unneccessary data .. rows: [{},{}] }
  let SQL = `SELECT search_query FROM cities;`;
  client.query(SQL)
    .then (result=>{
      console.log(result.rows);

      let cityArr = result.rows.map(item => {
        return item.search_query;
      });

      console.log('cityArr :');
      // array of searched cities ['amman,'irbid, ...]
      console.log(cityArr);


      if(cityArr.includes(cityName)) {
        console.log(`--------------------------------------`);
        console.log(`found ${cityName} in database!`);

        let SQL = `SELECT * FROM cities WHERE search_query =$1`;
        let safeValues = [cityName];
        client.query(SQL,safeValues)
          .then (result=>{
            console.log(`Returned ${cityName} data from database is :`);
            console.log(result.rows);

            res.send(result.rows[0]); // result.rows[0]= { first obj (record)}
            console.log(`Response sent! :--------------------`);
            console.log(result.rows[0]);
          });


      }
      else {

        hitApi(res,cityName,URL);}
    });
}//function


function hitApi (res,cityName,URL)
{
  console.log(`--------------------------------------`);
  console.log(` ${cityName} not found in database!`);

  //1) Hit API to get city DATA :
  superagent.get(URL) //send request to LocationIQ API
    .then(fullLocationData => {
      let locationData = fullLocationData.body;
      const locationObj = new Location(cityName, locationData);



      //2) Save city Api DATA in databas :

      console.log(`--------------------------------------`);
      console.log(` This is ${cityName} api data:`);

      console.log(locationObj);


      saveToDatabaseApi(res,locationObj);

    }).catch(error=>{
      res.send(error);
    });//speragent
}//else

//-----------------------------
function saveToDatabaseApi (res,locationObj)
{
  let searchQuery = locationObj.search_query;
  let formattedQuery = locationObj.formatted_query;
  let latitude = locationObj.latitude;
  let longitude = locationObj.longitude;

  console.log(`--------------------------------------`);
  console.log(`Saving ${searchQuery} data in database ....`);
  // console.log(locationObj);

  //save values in table + return sent values from database in result.rows
  // in SQL : put names in schema.sql
  let SQL = `INSERT INTO cities (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;

  let safeValues = [searchQuery,formattedQuery,latitude,longitude];

  client.query(SQL,safeValues)
    .then(result=>{

      console.log(`--------------------------------------`);
      console.log(`Returned ${searchQuery} data from database is :`);

      console.log(result.rows);

      res.send(result.rows[0]);
      console.log(`Response sent! :---------------------`);
      console.log(result.rows[0]);


      //result.rows --> when using query() method
      // -->  returns in results uneccessary rubish data
      // result.rows --> takes data left the rest
    }).catch(error=>{
      res.send(error);});


}


//-------------------------------------
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

    }).catch(error=>{
      res.send(error);
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
      // console.log(parkData);

      let parkObjArr = parkData.map(item => {
        return new Park (item); });


      res.send(parkObjArr);

      // }

    }).catch(error=>{
      res.send(error);
    });
  // res.send(weatherObjArr);
  // if we put here it will be excuted before object is filled

}
//--------------------------

function movieRoutHandler (req,res) {

  let key = process.env.MOVIE_API_KEY;


  let cityName = req.query.search_query;

  // test if api request is working:
  // in browser : https://api.themoviedb.org/3/search/movie?api_key=afbde666843f76b1afa9e080eca93939&query=paris

  // api returns : body data

  //superagent : body data + rubish data
  let movieURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${cityName}`;

  superagent.get(movieURL) //send request to MovieDB API
    .then(fullMovieData => {

      let movieData = fullMovieData.body.results; //body {"":"" , "":"" , "results":[{},{}]}
      // console.log(movieData);

      let movieObjArr = movieData.map(item => {
        return new Movie (item); });

      res.send(movieObjArr);


    }).catch(error=>{
      res.send(error);
    });
}

//---------------------------------------
//yelp website :
// gives code samples on github :
// https://github.com/Yelp/yelp-fusion#code-samples

function yelpRoutHandler (req,res)
{
  let key = process.env.YELP_API_KEY;

  const client = yelp.client(key);

  //--------------------------Pagination :

  let page = req.query.page;
  //each click on 'load more' sends new request
  //page is query string parameter
  //second click --> page = 2
  //5th click --> page = 5

  let itemsPerPage = 5;
  let startIndex = ((page - 1) * itemsPerPage + 1);


  // choice 1 ------------------------:
  let cityName = req.query.search_query;
  let strQueryObj ={location: cityName,
    limit: itemsPerPage,
    offset: startIndex};

  // or choice 2 -----------------------:
  // let lat=	req.query.latitude;
  // let lon = req.query.longitude;
  // let strQueryObj ={latitude: lat,
  //   longitude: lon,
  //   limit: itemsPerPage,
  // offset: startIndex};


  client.search(strQueryObj) //send request to yelp Api , including key
    .then(fullYelpData => {

      // fullYelpData.body = '{...... , "businesses":[]}'
      // body is string in yelp api
      // parse --> fullYelpData.body = { ... , "businesses":[]}
      let yelpData = JSON.parse(fullYelpData.body).businesses;

      //another way:
      // let yelpData = fullYelpData.jsonBody.businesses; //jsonBody is not string = {...."businesses":[]}

      let yelpObjArr = yelpData.map(item => {
        return new Yelp (item); });

      res.send(yelpObjArr);


    }).catch(error=>{
      res.send(error);
    });
}
//-----------------------------------------

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
};


//-------------------------------


const Weather = function (oneWeather)
{
  this.forecast = oneWeather.weather.description;
  this.time = new Date(oneWeather.valid_date).toDateString();
};



//-------------------------------


const Park = function (onePark)
{
  this.name =onePark.fullName;
  this.address = `${onePark.addresses[0].line1}, ${onePark.addresses[0].city}, ${onePark.addresses[0].stateCode} ${onePark.addresses[0].postalCode}`;
  this.fee = onePark.entranceFees[0].cost;
  this.description = onePark.description;
  this.url = onePark.url;
};


//------------------------------------
let Movie = function (oneMovie)
{

  this.title = oneMovie.title ,
  this.overview = oneMovie.overview,
  this.average_votes = oneMovie.average_votes ,
  this.total_votes = oneMovie.vote_count,
  //---------------------NOTES:
  //from Api documentation --> configration :
  //https://image.tmdb.org/t/p/w500/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg

  //base url: https://image.tmdb.org/t/p
  //image size:/w500
  //poster_path: 8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg

  //this.image_url = oneMovie.poster_path,
  //you get : "image_url": "/3LIn7bskDwsmyxMWTNWRIPSCm2X.jpg"
  this.image_url = `https://image.tmdb.org/t/p/w500${oneMovie.poster_path}`,
  this.popularity = oneMovie.popularity ,
  this.released_on = oneMovie.release_date;};

// {
//   "title": "Love Happens",
//   "overview": "Dr. Burke Ryan is a successful self-help author and motivational speaker with a secret. While he helps thousands of people cope with tragedy and personal loss, he secretly is unable to overcome the death of his late wife. It's not until Burke meets a fiercely independent florist named Eloise that he is forced to face his past and overcome his demons.",
//   "average_votes": "5.80",
//   "total_votes": "282",
//   "image_url": "https://image.tmdb.org/t/p/w500/pN51u0l8oSEsxAYiHUzzbMrMXH7.jpg",
//   "popularity": "15.7500",
//   "released_on": "2009-09-18"
// },;

//------------------------------

const Yelp = function (oneYelp)
{

  this.name = oneYelp.name,
  this.image_url = oneYelp.image_url ,
  this.price = oneYelp.price,
  this.rating = oneYelp.rating,
  this.url = oneYelp.url;


  // [
  //   {
  //     "name": "Pike Place Chowder",
  //     "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg",
  //     "price": "$$   ",
  //     "rating": "4.5",
  //     "url": "https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
  //   }, ...
  //  ]

};


//----------------------------------------
//Server Listner

// used to debug --> how?
// if express connected with postgres sucessfully-->
// express start listnening --> console.log -->

client.connect() //--------------------lab03
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on ${PORT}`));

  }).catch(error=>{
    console.log(error);
  });

//connect express server to postgres server
// only when done (connection worked!) ---->
// prepare express to listen to browser requests
