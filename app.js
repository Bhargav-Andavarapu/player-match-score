const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
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

initializeDBAndServer();

//API-1 Get all players
const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
        SELECT
            *
        FROM
            player_details;
    `;
  const allPlayersArray = await db.all(getAllPlayersQuery);
  response.send(
    allPlayersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//API-2 Get a player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getAPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};
    `;
  const playerDetails = await db.get(getAPlayerQuery);
  response.send(convertPlayerObjectToResponseObject(playerDetails));
});

//API-3 Update Player Details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerName = `
        UPDATE
            player_details
        SET
            player_name = "${playerName}"
        WHERE
            player_id = ${playerId};
    `;
  await db.run(updatePlayerName);
  response.send("Player Details Updated");
});

//API-4 Get Match Details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

//API-5 Get a Player All Match Details
const convertPlayerMatchDetailsObjectTOResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allPlayerMatchQuery = `
        SELECT
            match_id,
            match,
            year
        FROM
            match_details
            NATURAL JOIN player_match_score
        WHERE
            player_id = ${playerId};
    `;
  const playerMatchArray = await db.all(allPlayerMatchQuery);
  response.send(
    playerMatchArray.map((eachMatch) =>
      convertPlayerMatchDetailsObjectTOResponseObject(eachMatch)
    )
  );
});

//API-6 Get all Players for Specific Match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersForASpecificMatch = `
        SELECT
            player_id,
            player_name
        FROM
            player_details
            NATURAL JOIN player_match_score
        WHERE
            match_id = ${matchId};
    `;
  const playerDetailsArray = await db.all(getAllPlayersForASpecificMatch);
  response.send(
    playerDetailsArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//API-7 Player Stats
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
        SELECT
            player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM
            player_match_score
            NATURAL JOIN player_details
        WHERE
            player_id = ${playerId};
    `;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
