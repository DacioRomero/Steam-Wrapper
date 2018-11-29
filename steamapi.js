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
                    if (error !== null) {
                        reject(error);
                    } else if (response !== null) {
                        if (response.statusCode >= 400) {
                            reject(Error(`HTTP Code ${response.statusCode}`));
                        } else if (body !== null) {
                            if (!body[appid].success) {
                                reject(Error('Request unsuccessful: likely Invalid appid'));
                            } else if (body[appid].data !== null) {
                                resolve(body[appid].data);
                            } else {
                                reject(Error('API returned no data'))
                            }
                        }
                    } else {
                        reject(Error('No response'));
                    }
                })
        })
    }

    getOwnedGames(steamid) {
        console.log(typeof steamid)
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
                    if (error !== null) {
                        reject(error);
                    } else if (response !== null) {
                        if (response.statusCode >= 400) {
                            reject(Error(`Steam API: Returned HTTP Code ${response.statusCode}`));
                        } else if (body !== null) {
                            if (Object.keys(body.response).length === 0) {
                                reject(Error('Steam API: Request unsuccessful: likely invalid steamid'));
                            } else if (body.response.games !== null) {
                                resolve(body.response.games.map(game => game.appid));
                            } else {
                                reject(Error('Steam API: No data returned'));
                            }
                        }
                    } else {
                        reject(Error('No response'));
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
