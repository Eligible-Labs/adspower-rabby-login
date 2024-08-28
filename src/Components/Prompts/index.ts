import path from 'node:path';
import { input, password } from '@inquirer/prompts';
import type { AppConfig } from 'src/App';
import { AdsPowerApi } from '@src/Components/AdsPowerApi';
import type { Account } from '@src/Components/Browser';
import { InternalErrorCodes } from '@src/Constants/Errors';
import { InternalError } from '@src/Errors/InternalError';
import { notExisting } from '@src/Helpers/index';
import { logger } from '@src/Libs/Logger';
import { xlsx } from '@src/Libs/Xlsx';
import { Validators } from './Validators';

const XLSX_FILE_HEADERS = ['accountNumber', 'privateKey', 'adsUserId'];

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

	private async getAndValidateFileContent(path: string, password: string, config: AppConfig) {
		const content = await xlsx.getContent<Account>(path, password, { headers: XLSX_FILE_HEADERS });

		const headers = content.shift();

		logger.info({ code: 'got_file_content', data: { headers, path } });

		const { accounts, errors } = Validators.accounts(content);

		if (errors.length > 0) {
			throw new InternalError({ code: InternalErrorCodes.fileInvalidBody, data: { errors } });
		}

		if (accounts.length === 0) {
			throw new InternalError({ code: InternalErrorCodes.fileNoAccounts });
		}

		const adsUserIds = accounts.map(({ adsUserId }) => adsUserId);

		const adsApi = new AdsPowerApi({ baseURL: config.ads_power_api_url });

		const adsProfilesFound = await adsApi.findProfiles(adsUserIds);

		const notFoundAdsUserIds = notExisting(adsUserIds, adsProfilesFound);

		if (notFoundAdsUserIds.length > 0) {
			throw new InternalError({ code: InternalErrorCodes.fileAdsNotFound, data: { errors: notFoundAdsUserIds } });
		}

		if (config.accounts_to_login === 'all') {
			return accounts;
		}

		const accountNumbersToFind = config.accounts_to_login as number[];
		const foundAccounts = accounts.filter(({ accountNumber }) => accountNumbersToFind.includes(accountNumber));
		const foundAccountNumbers = foundAccounts.map(({ accountNumber }) => accountNumber);
		const notFoundAccountNumbers = notExisting(accountNumbersToFind, foundAccountNumbers)

		if (notFoundAccountNumbers.length > 0) {
			throw new InternalError({
				code: InternalErrorCodes.fileAccountNotFound,
				data: { errors: notFoundAccountNumbers },
			});
		}

		return foundAccounts;
	}
}
