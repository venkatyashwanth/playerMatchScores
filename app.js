const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API-1
const convertDb1 = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayer = `
    SELECT
        * 
    FROM 
        player_details;
    `;
  const playersArray = await database.all(getPlayer);
  response.send(playersArray.map((eachPlayer) => convertDb1(eachPlayer)));
});

//API-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT 
        * 
    FROM 
        player_details 
    WHERE 
        player_id = ${playerId};
    `;
  const player = await database.get(getQuery);
  response.send(convertDb1(player));
});

//API-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updateQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};
    `;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

//API-4:
const convertDb2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT 
        * 
    FROM 
        match_details 
    WHERE 
        match_id = ${matchId};
    `;
  const matchDetails = await database.get(matchDetailsQuery);
  response.send(convertDb2(matchDetails));
});

//API-5:
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayers = `
    SELECT 
        * 
    FROM player_match_score 
        NATURAL JOIN match_details 
    WHERE 
        player_id = ${playerId};
  `;
  const playerMatches = await database.all(getPlayers);
  response.send(playerMatches.map((eachMatch) => convertDb2(eachMatch)));
});

//API-6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
        SELECT 
            * 
        FROM player_match_score 
            NATURAL JOIN player_details 
        WHERE 
            match_id = ${matchId};    
    `;
  const playersArray = await database.all(getQuery);
  response.send(playersArray.map((eachPlayer) => convertDb1(eachPlayer)));
});

//API-7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM player_match_score 
        NATURAL JOIN player_details 
    WHERE 
        player_id = ${playerId};
    `;
  const playerMatchDetails = await database.get(getQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
