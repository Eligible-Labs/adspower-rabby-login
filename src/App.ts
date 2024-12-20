import { type Account, Browser } from '@src/Components/Browser';
import { Prompts, RowNumberSetting } from '@src/Components/Prompts';
import { InternalError } from '@src/Errors/InternalError';
import pMap from 'p-map';
import { logger } from '@src/Libs/Logger';
import { cpus } from 'node:os';
import { ApiBottleneck } from './Components/ApiBottleneck';
import { appendFile } from 'node:fs/promises';
import { getProxyKey } from './Helpers';

export type AppConfig = {
	db_file_path: string;
	db_proxies_file_path: string;
	db_proxies_used_file_path: string;
	close_browser_after_login: boolean;
	create_ads_profile_before_login: boolean;
	concurrency: number | 'auto';
	rows_to_login: RowNumberSetting;
	rows_to_ignore: RowNumberSetting;
	ads_power_api_url: string;
	chrome_extension_id: string;
};

export class App {
	private readonly config: AppConfig;

	public constructor(config: AppConfig) {
		this.config = config;
	}

	public async start() {
		try {
			const prompts = new Prompts();

			logger.info({ code: 'app_main_process_start', message: 'Стартуем!' });

			const { accounts, walletsPassword } = await prompts.getInputsForStart(this.config);

			logger.info({ code: 'got_accounts', message: 'Получены аккаунты из файла и пароль' });

			await this.processAccounts(accounts, walletsPassword);

			logger.info({ code: 'app_main_process_done', message: 'Процесс завершен' });
		} catch (error) {
			logger.error(error, 'app_main_process_error');

			if (error instanceof InternalError && error.data.errors) {
				// biome-ignore lint/nursery/noConsole: <explanation>
				console.table(error.data.errors);
			}
		}
	}

	private async processAccounts(accounts: Account[], walletsPassword: string) {
		const concurrency = this.config.concurrency === 'auto' ? cpus().length : this.config.concurrency;

		const apiBottleneck = new ApiBottleneck(this.config.ads_power_api_url);

		await apiBottleneck.initServer();

		const mapper = async (account: Account) => {
			const browser = new Browser({
				...account,
				rabbyPassword: walletsPassword,
				adsApiBaseURL: apiBottleneck.endpoint,
				chromeExtId: this.config.chrome_extension_id,
				createAdsProfile: this.config.create_ads_profile_before_login,
			});

			try {
				await browser.process();

				if (this.config.close_browser_after_login) {
					await browser.close();
				}
			} catch (error) {
				logger.error(error, 'account_process_error', { user_id: account.adsUserId });
			} finally {
				if (account.proxy) {
					await appendFile(this.config.db_proxies_used_file_path, `${getProxyKey(account.proxy)}\n`)
				}
			}
		};

		await pMap(accounts, mapper, { concurrency });
	}
}
