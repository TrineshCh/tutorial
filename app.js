const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbpath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Sucessfully Running on port no. 3000....')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDBServer()

//GET Movies List

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    select
        *
    From
        movie;`
  const moviesArray = await db.all(getMoviesQuery)
  const {movie_id, director_id, movie_name, lead_actor} = moviesArray
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

//POST Creates a new movie

app.post('/movies/', async (request, response) => {
  const getDetails = request.body
  const {directorId, movieName, leadActor} = getDetails
  const newMovieQuery = `
  INSERT INTO 
        movie(director_id,movie_name,lead_actor) 
  VALUES(
    ${directorId},
    '${movieName}',
    '${leadActor}'
    );
  `
  const dbResponse = await db.run(newMovieQuery)
  response.send('Movie Successfully Added')
})

//Returns Movie Based on ID

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT 
      * 
    FROM 
        movie 
    WHERE 
        movie_id=${movieId} `
  const givenMovie = await db.get(getMovieQuery)
  const {movie_id, director_id, movie_name, lead_actor} = givenMovie
  const dbResponse = {
    movieId: movie_id,
    directorId: director_id,
    movieName: movie_name,
    leadActor: lead_actor,
  }
  response.send(dbResponse)
})

//Update Details of Movie

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getBody = request.body
  const {directorId, movieName, leadActor} = getBody
  const updateMovieQuery = `UPDATE movie SET director_id=${directorId}, movie_name='${movieName}', lead_actor='${leadActor}' 
  WHERE movie_id=${movieId}`
  const dbResponse = await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//Deletes a movie from the movie table

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id=${movieId}`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

//GET list of all directors

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director`
  const directorsArray = await db.all(getDirectorsQuery)
  const {director_id, director_name} = directorsArray

  response.send(
    directorsArray.map(eachDir => ({
      directorId: eachDir.director_id,
      directorName: eachDir.director_name,
    })),
  )
})

//Returns a list of all movie names directed by a specific director

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMoviesQuery = `
    SELECT * 
    FROM movie 
    INNER JOIN director 
    ON movie.director_id = director.director_id 
    WHERE director.director_id = ${directorId};`
  const dirMoviesArray = await db.all(getDirectorMoviesQuery)
  response.send(
    dirMoviesArray.map(eachDirMovies => ({
      movieName: eachDirMovies.movie_name,
    })),
  )
})

module.exports = app
