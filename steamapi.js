// utils/steam.js
const Promise = require('bluebird');
const request = require('request');

class SteamAPI {
    constructor(key) {
        this.key = key;
    }

    GetAppDetails(appid, filters = null) {
        return new Promise((resolve, reject) => {
            request.get('https://store.steampowered.com/api/appdetails/', {
                    qs: {
                        appids: appid,
                        filters: filters.join(',')
                    },
                    json: true
                },
                (error, response, body) => {
                    try {
                        return resolve(body[appid].data);
                    } catch (e) {
                        if (body == null || !body[appid].success) {
                            return reject(Error(`Steam API: appid ${appid} is invalid`))
                        }
                        reject(ErrorHandler(error, response, body, e));
                    }
                });
        })
    }

    GetOwnedGames(steamid, include_played_free_games = 1) {
        return new Promise((resolve, reject) => {
            request.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
                    qs: {
                        key: this.key,
                        steamid,
                        include_played_free_games
                    },
                    json: true
                },
                (error, response, body) => {
                    try {
                        resolve(body.response.games.map(game => game.appid));
                    } catch (e) {
                        if (body.response == null || body.response.games == null) {
                            return reject(Error('Steam API: No data'));
                        }
                        reject(ErrorHandler(error, response, body, e));
                    }
                });
        });
    }

    GetPlayerSummaries(...steamids) {
        return new Promise((resolve, reject) => {
            request.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
                    qs: {
                        key: this.key,
                        steamids: steamids.join(',')
                    },
                    json: true
                },
                (error, response, body) => {
                    try {
                        // Convert to object for id indexing
                        const players = body.response.players.reduce((obj, player) =>
                            Object.assign({}, obj, {
                                [player.steamid]: player
                            }), {})

                        return resolve(players);
                    } catch (e) {
                        reject(ErrorHandler(error, response, body, e));
                    }
                });
        });
    }
}

function ErrorHandler(error, response, body, e) {
    if (error != null) {
        return Error(`Steam API: ${error.reason}`);
    }

    if (response == null) {
        return Error('Steam API: No response');
    }

    switch(response.statusCode) {
        case 403:
            return Error('Steam API: Invalid key');
        case 500:
            return Error('Steam API: Server error, check input')
    }

    return e;
}

if (require.main === module) {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter your Steam API key: ', key => {
        const Steam = new SteamAPI(key);

        Steam.GetAppDetails(440)
            .then(details => {
                console.log('Steam.GetAppDetails');
                console.log(Object.keys(details));
            })
            .catch(error => {
                console.log(error);
            });

        Steam.GetOwnedGames('76561198045036427')
            .then(games => {
                console.log('Steam.GetOwnedGames');
                console.log(games);
            })
            .catch(error => {
                console.log(error);
            });

        Steam.GetPlayerSummaries('76561198045036427', '76561198051193865')
            .then(summaries => {
                console.log('Steam.GetPlayerSummaries')
                console.log(Object.keys(summaries));
            })
            .catch(error => {
                console.error(error);
            });

        rl.close();
    });
}

module.exports = (key = null) => {
    key = key || process.env.STEAM_API_KEY;

    if (key == null) {
        throw Error('Steam API: Key must be provided as argument or in environment')
    } else {
        return new SteamAPI(key);
    }
}
