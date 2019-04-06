import axios from 'axios';

import keyBy from 'lodash/keyBy';
import zipObject from 'lodash/zipObject';

// Modifed verison of https://stackoverflow.com/a/37016639
const urlRe = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([^/?]+)/;
const steamidRe = /\d{17}/;
const bigpicture = axios.create({
  baseURL: 'https://store.steampowered.com/api/',
});

export default class SteamWrapper {
  constructor(key) {
    this.steampowered = axios.create({
      baseURL: 'https://api.steampowered.com/',
      params: { key },
    });
  }

  static async GetAppDetails(appid, filters = []) {
    const {
      data: {
        [appid]: {
          success,
          data: details,
        },
      },
    } = await bigpicture.get('/appdetails/', {
      params: {
        appids: appid,
        filters: filters.join(','),
      },
    });

    if (!success) {
      throw Error(`Unable to get details for app ${appid}`);
    }

    return details;
  }

  async GetOwnedGames(steamid, includeFree = true) {
    const {
      data: { response: { games } },
    } = await this.steampowered.get('/IPlayerService/GetOwnedGames/v1/', {
      params: {
        steamid,
        include_played_free_games: Number(includeFree),
      },
    });

    return games.map(game => game.appid);
  }

  async GetPlayerSummaries(...steamids) {
    const { data: { response: { players } } } = await this.steampowered.get('/ISteamUser/GetPlayerSummaries/v2/', {
      params: { steamids: steamids.join(',') },
    });

    return { ...zipObject(steamids, [false] * steamids.length), ...keyBy(players, 'steamid') };
  }

  async GetSteamId64(input) {
    const urlMatch = urlRe.exec(input);
    const profile = (urlMatch && urlMatch[1]) || input;

    const steamidMatch = steamidRe.exec(profile);

    if (steamidMatch) {
      return steamidMatch[0];
    }

    const {
      data: {
        response: {
          success,
          steamid,
          message,
        },
      },
    } = await this.steampowered.get('/ISteamUser/ResolveVanityURL/v1/', {
      params: { vanityurl: profile },
    });

    if (success === 1) {
      return steamid;
    }

    // success === 42
    throw Error(message);
  }
}
