const mysql = require("mysql");

class Database {
    constructor(config) {
        this.pool = mysql.createPool({
            ...config,
            connectionLimit: 8,
            waitForConnections: true,
        });
    }

    asyncConnection = async () => {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(conn);
                }
            });
        });
    };

    connectionQuery = async (command, args) => {
        const conn = await asyncConnection();
        const asyncQuery = (command, args) => {
            return new Promise((resolve, reject) => {
                conn.query(command, args, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        };
        const queryResult = await asyncQuery(command, args);
        conn.release();
        return queryResult;
    };
}

module.exports = Database;
