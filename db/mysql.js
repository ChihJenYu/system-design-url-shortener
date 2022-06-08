const mysql = require("mysql");

class Database {
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    async connectionQuery(command, args) {
        const asyncQuery = (command, args) => {
            return new Promise((resolve, reject) => {
                this.pool.query(command, args, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        };
        const queryResult = await asyncQuery(command, args);
        return queryResult;
    }
}

module.exports = Database;
