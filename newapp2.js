const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')
let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Sucessfully Running on port no. 3000....')
    })
  } catch (error) {
    console.log(`DataBase error is ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

const convertMatchDetailsDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertMatchDetailsDbObjectToResponseObject2 = dbObject => {
  return {
    district_id: dbObject.districtId,
    district_name: dbObject.districtName,
    state_id: dbObject.stateId,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//TOKEN AUTHENTICATION
const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

//API 1

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken: jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 2

app.get('/states/', authenticateToken, async (request, response) => {
  const statesQuery = `SELECT * FROM state`
  const dbResponse = await db.all(statesQuery)
  response.send(
    dbResponse.map(eachState =>
      convertMatchDetailsDbObjectToResponseObject(eachState),
    ),
  )
})

//API 3

app.get('/states/:stateId/', authenticateToken, async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `SELECT * FROM state WHERE state_id=${stateId};`
  const dbResponse = await db.get(stateQuery)
  response.send(convertMatchDetailsDbObjectToResponseObject(dbResponse))
})

//API 4

app.post('/districts/', authenticateToken, async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const createDistrictQuery = `INSERT INTO
                    district ( district_name, state_id, cases,cured,active,deaths)
                  VALUES
                    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(createDistrictQuery)
  response.send('District Successfully Added')
})

//API 5

app.get(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const api5 = `SELECT * FROM district WHERE district_id = ${districtId};`
    const ans = await db.get(api5)
    const resp = {
      districtId: ans.district_id,
      districtName: ans.district_name,
      stateId: ans.state_id,
      cases: ans.cases,
      cured: ans.cured,
      active: ans.active,
      deaths: ans.deaths,
    }
    response.send(resp)
  },
)

//API 6

app.delete(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const api6 = `DELETE FROM district WHERE district_id = ${districtId};`
    await db.run(api6)
    response.send('District Removed')
  },
)

//API 7

app.put(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const {districtName, stateId, cases, cured, active, deaths} = request.body
    const api7 = `UPDATE district SET district_name = '${districtName}',state_id = ${stateId},cases = ${cases},cured = ${cured},active = ${active},deaths = ${deaths} WHERE district_id = ${districtId};`
    await db.run(api7)
    response.send('District Details Updated')
  },
)

//API 8

app.get(
  '/states/:stateId/stats',
  authenticateToken,
  async (request, response) => {
    const {stateId} = request.params
    const api8 = `SELECT SUM(cases) as totalCases ,SUM(cured) as totalCured ,SUM(active) as totalActive ,SUM(deaths) as totalDeaths FROM district WHERE state_id = ${stateId};`
    const ans = await db.get(api8)
    const resp = {
      totalCases: ans.totalCases,
      totalCured: ans.totalCured,
      totalActive: ans.totalActive,
      totalDeaths: ans.totalDeaths,
    }
    response.send(resp)
  },
)

module.exports = app
