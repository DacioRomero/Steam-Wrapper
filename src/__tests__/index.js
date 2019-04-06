import fs from 'fs';
import path from 'path';
import mockAxios from 'jest-mock-axios';
import SteamWrapper from '..';

jest.mock('axios');

const wrapper = new SteamWrapper('testkey');

describe('GetAppDetails', () => {
  afterEach(() => {
    mockAxios.reset();
  });

  it('should return data', async () => {
    const gameObj = JSON.parse(fs.readFileSync(path.join(__dirname, './games/440.json')));

    const promise = SteamWrapper.GetAppDetails(440);

    mockAxios.mockResponse({
      data: gameObj,
    });

    const result = await promise;

    expect(result).toEqual(gameObj[440].data);
  });

  it('should throw an error', async () => {
    const gameObj = JSON.parse(fs.readFileSync(path.join(__dirname, './games/1.json')));

    const promise = SteamWrapper.GetAppDetails(1);

    mockAxios.mockResponse({
      data: gameObj,
    });

    await expect(promise).rejects.toThrow(new Error('Unable to get details for app 1'));
  });
});

describe('GetOwnedGames', () => {
  it('should return an array of ids', async () => {
    const libJson = JSON.parse(fs.readFileSync(path.join(__dirname, './libraries/76561198045036427.json')));

    const promise = wrapper.GetOwnedGames('76561198045036427');

    mockAxios.mockResponse({
      data: libJson,
    });

    const result = await promise;

    expect(result).toEqual(libJson.response.games.map(game => game.appid));
  });
});

describe('GetPlayerSummaries', () => {
  it('should return profile', async () => {
    const profileObj = JSON.parse(fs.readFileSync(path.join(__dirname, './profiles/76561198045036427.json')));

    const promise = wrapper.GetPlayerSummaries('76561198045036427');

    mockAxios.mockResponse({
      data: profileObj,
    });

    const result = await promise;

    const { players } = profileObj.response;
    const expected = { [players[0].steamid]: players[0] };

    expect(result).toMatchObject(expected);
  });
});

describe('GetSteamId64', () => {
  it('should resolve steamid', async () => {
    const result = await wrapper.GetSteamId64('76561198045036427');

    expect(result).toEqual('76561198045036427');
  });

  it('should resolve normal url', async () => {
    const result = await wrapper.GetSteamId64('https://steamcommunity.com/profiles/76561198051193865');

    expect(result).toEqual('76561198051193865');
  });

  it('should resolve vanity url', async () => {
    const promise = wrapper.GetSteamId64('https://steamcommunity.com/id/DacioRomero/');

    mockAxios.mockResponse({
      data: {
        response: {
          steamid: '76561198045036427',
          success: 1,
        },
      },
    });

    const result = await promise;

    expect(result).toEqual('76561198045036427');
  });

  it('should throw error', async () => {
    const promise = wrapper.GetSteamId64('https://steamcommunity.com/id/DacioR/');

    mockAxios.mockResponse({
      data: {
        response: {
          success: 42,
          message: 'No match',
        },
      },
    });

    await expect(promise).rejects.toThrow(new Error('No match'));
  });
});
