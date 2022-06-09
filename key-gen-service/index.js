const PORT = 3001;
const express = require("express");
const app = express();
const Database = require("../db/mysql");
const redis = require("../cache/redis");
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const keysSet = new Set();
const keysArray = [];
let iterator = 0;

for (let i = 0; i < CHARS.length; i++) {
    for (let j = 0; j < CHARS.length; j++) {
        for (let k = 0; k < CHARS.length; k++) {
            let string = CHARS[i] + CHARS[j] + CHARS[k];
            keysSet.add(string);
        }
    }
}

keysSet.forEach((k) => {
    keysArray.push(k);
});

app.use(express.json());

app.get("/url", async (req, res) => {
    const afterIncrement = await redis.INCRBY("iterator", "10000");
    iterator = afterIncrement - 10000;
    console.log(`Iterator: ${iterator}; afterIncrement: ${afterIncrement}`);
    const shortUrls = keysArray.slice(iterator, iterator + 10000);
    if (shortUrls.length != 0) {
        res.send({ shortUrls });
        iterator = afterIncrement;
    } else {
        res.send({ error: "No more space!" });
    }
});

app.listen(PORT, () => {
    console.log("KGS is listening on: ", PORT);
});
