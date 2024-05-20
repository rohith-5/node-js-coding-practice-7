const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

let db = null
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initDBAndServer()

// Get players API - 1
app.get('/players/', async (request, response) => {
  const query = `select * from player_details;`

  const playersArr = await db.all(query)
  const res = player => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    }
  }
  response.send(playersArr.map(player => res(player)))
})

// Get player API - 2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `select * from player_details where player_id=${playerId};`

  const player = await db.get(query)
  const resu = player => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    }
  }
  response.send(resu(player))
})

// Put player API - 3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const query = `update player_details set player_name='${playerName}';`

  await db.run(query)
  response.send('Player Details Updated')
})

// Get match API - 4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const query = `select * from match_details where match_id=${matchId};`

  const match = await db.get(query)
  const res = match => {
    return {
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    }
  }
  response.send(res(match))
})

// Get specific player matches API - 5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query = `select match_details.match_id, match_details.match, match_details.year 
  from
  player_details inner join player_match_score 
  on player_details.player_id = player_match_score.player_id 
  inner join match_details 
  on player_match_score.match_id = match_details.match_id
  where 
  player_details.player_id=${playerId};`

  const matchesArr = await db.all(query)
  const res = match => {
    return {
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    }
  }
  response.send(matchesArr.map(match => res(match)))
})

// Get specific match players API - 6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`

  const playersArr = await db.all(query)

  response.send(playersArr)
})

// Get specific player stats API - 7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const query = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `

  const stats = await db.get(query)
  response.send(stats)
})

module.exports = app
