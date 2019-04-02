import axios from 'axios';

const bigpicture = axios.create({
  baseURL: 'https://store.steampowered.com/api/',
});

// Modifed verison of https://stackoverflow.com/a/37016639
const urlRe = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([^/?]+)/;
const steamidRe = /\d{17}/;

class SteamWrapper {
  constructor(key) {
    this.steampowered = axios.create({
      baseURL: 'https://api.steampowered.com/',
      params: { key },
    });
  }

  static async GetAppDetails(appid, filters = []) {
    try {
      const res = await bigpicture.get('/appdetails/', {
        params: {
          appids: appid,
          filters: filters.join(','),
        },
      });

      return res.data[appid].data;
    } catch (err) {
      // Continue to return null;
    }

    return null;
  }

  async GetOwnedGames(steamid, includeFree = 1) {
    try {
      const res = await this.steampowered.get('/IPlayerService/GetOwnedGames/v1/', {
        params: {
          steamid,
          include_played_free_games: includeFree,
        },
      });

      const { response } = res.data;

      return response.games.map(game => game.appid);
    } catch (err) {
      // Continue to return null
    }

    return null;
  }

  async GetPlayerSummaries(...steamids) {
    try {
      const res = await this.steampowered.get('/ISteamUser/GetPlayerSummaries/v2/', {
        params: { steamids: steamids.join(',') },
      });

      let { players } = res.data.response;

      const defaults = steamids.reduce((prev, id) => (
        { ...prev, [id]: null }
      ), {});

      players = players.reduce((prev, player) => {
        const { steamid, ...newPlayer } = player;

        return { ...prev, [steamid]: newPlayer };
      }, {});

      return { ...defaults, ...players };
    } catch (err) {
      // Continue
    }

    return null;
  }

  async GetSteamId64(input) {
    const urlMatch = urlRe.exec(input);
    let profile;

    if (urlMatch) {
      [, profile] = urlMatch;
    } else {
      profile = input;
    }

    const steamidMatch = steamidRe.exec(profile);

    if (steamidMatch) {
      return steamidMatch[0];
    }

    try {
      const res = await this.steampowered.get('/ISteamUser/ResolveVanityURL/v1/', {
        params: { vanityurl: profile },
      });

      return res.data.response.steamid;
    } catch (err) {
      // Continue
    }

    return null;
  }
}

export default SteamWrapper;
