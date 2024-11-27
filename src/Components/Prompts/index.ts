import path from 'node:path';
import { input, password } from '@inquirer/prompts';
import type { AppConfig } from 'src/App';
import { AdsPowerApi } from '@src/Components/AdsPowerApi';
import type { Account } from '@src/Components/Browser';
import { InternalErrorCodes } from '@src/Constants/Errors';
import { InternalError } from '@src/Errors/InternalError';
import { getProxyKey, notExisting, sleep } from '@src/Helpers/index';
import { logger } from '@src/Libs/Logger';
import { xlsx } from '@src/Libs/Xlsx';
import _ from 'lodash'
import { Validators } from './Validators';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const XLSX_FILE_HEADERS = ['accountNumber', 'privateKey', 'adsUserId'];

export type RowNumberSetting = number[] | 'all' | number | [number, number][]

export class Prompts {
	public async getInputsForStart(config: AppConfig) {
		const dbFilePath = await input({
			message: 'Путь до .xlsx или .csv файла',
			default: config.db_file_path,
			validate: async (input) => await Validators.dbFilePath(input),
		});

		const dbFilePassword = await password({
			message: `Пароль от ${path.basename(dbFilePath)}`,
			validate: (input) => Validators.dbFilePassword(dbFilePath, input),
		});

		const accounts = await this.getAndValidateFileContent(dbFilePath, dbFilePassword, config);

		if (config.create_browser_before_login) {
			const proxies = await this.getActualProxies(config);

			if (!proxies.length) {
				throw new InternalError({ code: InternalErrorCodes.proxyNotFound });
			}

			if (proxies.length < accounts.length) {
				throw new InternalError({ code: InternalErrorCodes.proxyNotEnough });
			}

			for (const account of accounts) {
				account.proxy = proxies.pop();
			}
		}

		const walletsPassword = await password({
			message: 'Пароль, будет задан для всех Rabby wallet',
			validate: (input) => Validators.password(input),
		});

		await password({
			message: 'Подтверди пароль для Rabby wallet',
			validate: (input) => Validators.password(input, walletsPassword),
		});

		return {
			accounts,
			walletsPassword,
		};
	}

	private checkRowAllowed(setting: RowNumberSetting, row: number): boolean {
		if (setting === 'all') {
			return true;
		} else if (typeof setting === 'number') {
			return row === setting;
		} else if (Array.isArray(setting)) {
			if (setting.length > 0 && Array.isArray(setting[0])) {
				return (setting as [number, number][]).some(([start, end]) => row >= start && row <= end);
			} else {
				return (setting as number[]).includes(row);
			}
		}

		return false;
	}


	private checkRowNotIgnored(setting: RowNumberSetting, row: number): boolean {
		if (setting === 'all') {
			return false;
		} else if (typeof setting === 'number') {
			return row !== setting;
		} else if (Array.isArray(setting)) {
			if (setting.length > 0 && Array.isArray(setting[0])) {
				return !(setting as [number, number][]).some(([start, end]) => row >= start && row <= end);
			} else {
				return !(setting as number[]).includes(row);
			}
		}

		return true;
	}

	private async getAndValidateFileContent(path: string, password: string, config: AppConfig) {
		const content = await xlsx.getContent<Account>(path, password, { headers: XLSX_FILE_HEADERS });

		const headers = content.shift();

		logger.info({ code: 'got_file_content', data: { headers, path } });

		const { accounts, errors } = Validators.accounts(content, !config.create_browser_before_login);

		if (errors.length > 0) {
			throw new InternalError({ code: InternalErrorCodes.fileInvalidBody, data: { errors } });
		}

		if (accounts.length === 0) {
			throw new InternalError({ code: InternalErrorCodes.fileNoAccounts });
		}

		const adsUserIds = accounts.map(({ adsUserId }) => adsUserId?.trim()).filter(Boolean);

		const adsApi = new AdsPowerApi({ baseURL: config.ads_power_api_url });

		const adsProfilesFound: string[] = [];

		for (const userIdsChunk of _.chunk(adsUserIds, 100)) {
			const found = await adsApi.findProfiles(userIdsChunk);
			adsProfilesFound.push(...found);
			await sleep(1000 * 1);
		}

		const notFoundAdsUserIds = notExisting(adsUserIds, adsProfilesFound);

		if (notFoundAdsUserIds.length > 0) {
			throw new InternalError({ code: InternalErrorCodes.fileAdsNotFound, data: { errors: notFoundAdsUserIds } });
		}

		const { rows_to_ignore, rows_to_login } = config;

		const resultRowNumbers: number[] = []

		const resultAccounts = accounts.filter((_, index) => {
			const rowNumber = index + 2;

			if (this.checkRowAllowed(rows_to_login, rowNumber) && this.checkRowNotIgnored(rows_to_ignore, rowNumber)) {
				resultRowNumbers.push(rowNumber);
				return true;
			}

			return false;
		});

		if (!resultAccounts.length) {
			throw new InternalError({
				code: InternalErrorCodes.fileNoAccounts,
			});
		}

		logger.info({ code: 'got_file_rows', message: `Строки для логина: ${resultRowNumbers}` });

		return resultAccounts;
	}

	private async loadProxies(filePath: string) {
		const proxies = (await readFile(filePath))
			.toString('utf-8')
			.split('\n')
			.map((line) => {
				const [ip, port, user, password] = line.trim().split(':');
				return {
					host: ip,
					port: port,
					user,
					password,
				};
			})
			.filter(({ host, port, user, password }) => host && port && user && password);

		return proxies;
	}

	private async loadUsedProxyKeys(filePath: string) {
		const usedProxies = await this.loadProxies(filePath)

		return new Set(usedProxies.map((proxy) => getProxyKey(proxy)));
	}

	private async getActualProxies(config: AppConfig) {
		const usedProxies = await this.loadUsedProxyKeys(config.db_proxies_used_file_path);
		const allProxies = await this.loadProxies(config.db_proxies_file_path);

		const notUsedProxies = allProxies.filter(proxy => !usedProxies.has(getProxyKey(proxy)))

		return notUsedProxies;
	}
}
