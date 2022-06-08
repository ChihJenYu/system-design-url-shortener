const PORT = 3000;
const express = require("express");
const app = express();
const axios = require("axios");
const Database = require("../db/mysql");
const DATABASE_LIMIT = 60000;
const databases = {};
const dbconfig = require("../dbconfig.json");
const tableName = "kgs_short_url";
const mapIdxToDatabase = (idx) => Math.floor(idx % dbconfig.length);
let localShortUrls = [];
let iterator = 0;

app.use(express.json());

app.post("/createUrl", async (req, res) => {
    // get a short url from cache and increment iterator; if iterator overflows, fetch from KGS
    if (localShortUrls.length == iterator) {
        const { data } = await axios.get("http://localhost:3001/url");
        if (data.error) {
            res.status(400).send({ error: data.error });
            return;
        } else {
            const { shortUrls, from, to } = data;
            localShortUrls = [...shortUrls];
            iterator = from;
        }
    }
    const { originUrl } = req.body;
    const shortUrl = localShortUrls[iterator];

    // save to db
    const whichDatabase = mapIdxToDatabase(iterator);
    if (!databases[whichDatabase]) {
        const database = new Database(dbconfig[whichDatabase]);
        databases[whichDatabase] = database;
    }
    const { insertId } = await databases[whichDatabase].connectionQuery(
        `INSERT INTO ${tableName} SET ?`,
        { originUrl, shortUrl }
    );

    iterator++;

    res.send({ shortUrl, insertId });
});

app.get("/getUrl/:shortUrl", async (req, res) => {
    const shortUrl = req.params.shortUrl;
    const { data } = await axios.post("http://localhost:3001/idx", {
        shortUrl,
    });
    const { idx } = data;
    const whichDatabase = mapIdxToDatabase(idx);
    if (!databases[whichDatabase]) {
        const database = new Database(dbconfig[whichDatabase]);
        databases[whichDatabase] = database;
    }
    const [resultPacket] = await databases[whichDatabase].connectionQuery(
        `SELECT * FROM ${tableName} WHERE shortUrl = ?`,
        shortUrl
    );
    res.send(resultPacket);
});

app.listen(PORT, () => {
    console.log("Server is listening on: ", PORT);
});
