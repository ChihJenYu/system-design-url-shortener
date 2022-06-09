const PORT = 3000;
const express = require("express");
const app = express();
const axios = require("axios");
const { mapShortUrlToCode } = require("../utils/util");
const Database = require("../db/mysql");
const databases = {};
const dbconfig = require("../dbconfig.json");
const tableName = "kgs_short_url";
const mapCodeToDatabase = (codeSum) => Math.floor(codeSum % dbconfig.length);
let localShortUrls = [];
let iterator = 0;

for (let i = 0; i < 4; i++) {
    databases[i] = new Database(dbconfig[i]);
}

app.use(express.json());

app.post("/createUrl", async (req, res) => {
    // get a short url from cache and increment iterator; if iterator overflows, fetch from KGS
    if (localShortUrls.length == iterator) {
        const { data } = await axios.get("http://52.74.39.71:3001/url");
        if (data.error) {
            res.status(400).send({ error: data.error });
            return;
        } else {
            const { shortUrls } = data;
            localShortUrls = [...shortUrls];
            iterator = 0;
        }
    }
    const { originUrl } = req.body;
    const shortUrl = localShortUrls[iterator];

    res.send({ shortUrl });

    // save to db
    const whichDatabase = mapCodeToDatabase(mapShortUrlToCode(shortUrl));
    await databases[whichDatabase].connectionQuery(`INSERT INTO ${tableName} SET ?`, {
        originUrl,
        shortUrl,
    });

    iterator++;
});

app.get("/getUrl/:shortUrl", async (req, res) => {
    const shortUrl = req.params.shortUrl;
    const whichDatabase = mapCodeToDatabase(mapShortUrlToCode(shortUrl));
    const [resultPacket] = await databases[whichDatabase].connectionQuery(
        `SELECT * FROM ${tableName} WHERE shortUrl = ?`,
        shortUrl
    );
    res.send(resultPacket);
});

app.listen(PORT, () => {
    console.log("Server is listening on: ", PORT);
});
