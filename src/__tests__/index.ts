import mockAxios from 'jest-mock-axios';
import SteamWrapper from '../index';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('axios');

const wrapper = new SteamWrapper('testkey');

afterEach((): void => {
  mockAxios.reset();
});

console.log(__dirname);
describe('GetAppDetails', (): void => {
  it('should return data', async (): Promise<void> => {
    const gameObj = JSON.parse(await fs.readFile(join(__dirname, './games/440.json'), 'utf-8'))

    const promise = SteamWrapper.GetAppDetails('440');

    mockAxios.mockResponse({
      data: gameObj,
    });

    const result = await promise;

    expect(result).toEqual(gameObj['440'].data);
  });

  it('should throw an error', async (): Promise<void> => {
    const gameObj = JSON.parse(await fs.readFile(join(__dirname, './games/1.json'), 'utf-8'))

    const promise = SteamWrapper.GetAppDetails('1');

    mockAxios.mockResponse({
      data: gameObj,
    });

    await expect(promise).rejects.toThrow(new Error('Unable to get details for app 1'));
  });
});

describe('GetOwnedGames', (): void => {
  it('should return an array of ids', async (): Promise<void> => {
    const libJson = JSON.parse(await fs.readFile(join(__dirname, './libraries/76561198045036427.json'), 'utf-8'))

    const promise = wrapper.GetOwnedGames('76561198045036427');

    mockAxios.mockResponse({
      data: libJson,
    });

    const result = await promise;

    expect(result).toEqual((libJson.response.games as {appid: string}[]).map((game): string => game.appid));
  });
});

describe('GetPlayerSummaries', (): void => {
  it('should return profile', async (): Promise<void> => {
    const profileObj = JSON.parse(await fs.readFile(join(__dirname, './profiles/76561198045036427.json'), 'utf-8'))

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

describe('GetSteamId64', (): void => {
  it('should resolve steamid', async (): Promise<void> => {
    const result = await wrapper.GetSteamId64('76561198045036427');

    expect(result).toEqual('76561198045036427');
  });

  it('should resolve normal url', async (): Promise<void> => {
    const result = await wrapper.GetSteamId64('https://steamcommunity.com/profiles/76561198051193865');

    expect(result).toEqual('76561198051193865');
  });

  it('should resolve vanity url', async (): Promise<void> => {
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

  it('should throw error', async (): Promise<void> => {
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
