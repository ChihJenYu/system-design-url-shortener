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
    databases[i] = {
        write_db: new Database(dbconfig[i].write_db),
        read_db: [],
    };
    for (let j = 0; j < 3; j++) {
        database[i].read_db.push(
            new Database({
                host: dbconfig[i].read_db[j],
                user: dbconfig[i].write_db.user,
                password: dbconfig[i].write_db.password,
                database: dbconfig[i].write_db.database,
            })
        );
    }
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
    await databases[whichDatabase].write_db.connectionQuery(
        `INSERT INTO ${tableName} SET ?`,
        {
            originUrl,
            shortUrl,
        }
    );
    iterator++;
});

app.get("/getUrl/:shortUrl", async (req, res) => {
    const shortUrl = req.params.shortUrl;
    const whichDatabase = mapCodeToDatabase(mapShortUrlToCode(shortUrl));
    const [resultPacket] = await databases[whichDatabase].read_db[
        Math.floor(Math.random * 3)
    ].connectionQuery(
        `SELECT * FROM ${tableName} WHERE shortUrl = ?`,
        shortUrl
    );
    res.send(resultPacket);
});

app.listen(PORT, () => {
    console.log("Server is listening on: ", PORT);
});
