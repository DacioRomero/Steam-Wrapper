const rp = require('request-promise');

module.exports = {
    getAppDetails: (appid, filters=null) => {
        return new Promise((resolve, reject) => {
            rp.get('https://store.steampowered.com/api/appdetails', {
                qs: {
                    appids: appid,
                    filters,
                    format: 'json'
                },
                json: true
            })
            .then(response => {
                resolve(response[appid].data);
            })
            .catch(error => {
                reject(error.message);
            })
        })
    },

    getOwnedGames: (key, steamid) => {
        return new Promise((resolve, reject) => {
            rp.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1', {
                    qs: {
                        key,
                        steamid
                    },
                    json: true
                })
                .then(response => {
                    resolve(response.response);
                })
                .catch(error => {
                    reject(error.message);
                })
        })
    }
}
