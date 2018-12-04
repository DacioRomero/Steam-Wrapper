// utils/steam.js
const Promise = require('bluebird');
const request = require('request');

class SteamAPI {
    constructor(key) {
        this.key = key;
    }

    getAppDetails(appid, filters = null) {
        return new Promise((resolve, reject) => {
            request.get('http://store.steampowered.com/api/appdetails', {
                    qs: {
                        appids: appid,
                        filters,
                        format: 'json'
                    },
                    json: true
                },
                (error, response, body) => {
                    try {
                        if (body == null || !body[appid].success) {
                            throw Error('Steam API: Invalid appid');
                        } else {
                            return resolve(body[appid].data);
                        }
                    } catch (e) {
                        // TODO: Separate into function
                        if (error != null) {
                            return reject(Error(error.reason));
                        }
                        if (response == null) {
                            return reject(Error(`Steam API: No response`));
                        }
                        if (response.headers["content-type"].indexOf('application/json') == -1) {
                            return reject(Error('Steam API: Did not return JSON'));
                        }
                        return reject(e)
                    }
                });
        })
    }

    getOwnedGames(steamid) {
        return new Promise((resolve, reject) => {
            request.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1', {
                    qs: {
                        key: this.key,
                        steamid,
                        include_played_free_games: 1
                    },
                    json: true
                },
                (error, response, body) => {
                    try {
                        if (body.response == null || body.response.games == null) {
                            return reject(Error('Steam API: No data'));
                        } else {
                            return resolve(body.response.games.map(game => game.appid));
                        }
                    } catch (e) {
                        // TODO: Separate into function
                        if (error != null) {
                            return reject(Error(error.reason));
                        }
                        if (response == null) {
                            return reject(Error(`Steam API: No response`));
                        }
                        if (response.headers["content-type"].indexOf('application/json') === -1) {
                            return reject(Error('Steam API: Did not return JSON'));
                        }
                        return reject(e)
                    }
                });
        });
    }
}

module.exports = (key = null) => {
    key = key || process.env.STEAM_API_KEY;

    if (typeof key === undefined) {
        throw 'Steam API key must be provided as argument or in environment!'
    } else {
        return new SteamAPI(key);
    }
}

if (require.main === module) {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter your Steam API key: ', key => {
        const steam = new SteamAPI(key);

        steam.getAppDetails(440)
            .then(details => {
                console.log('steam.getAppDetails works!');
            })
            .catch(error => {
                console.log(error);
            });
        steam.getOwnedGames('76561198045036427')
            .then(games => {
                console.log('steam.getOwnedGames works!');
            })
            .catch(error => {
                console.log(error);
            });

        rl.close();
    });
}