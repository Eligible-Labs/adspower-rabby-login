import { type Account, Browser } from '@src/Components/Browser';
import { Prompts, RowNumberSetting } from '@src/Components/Prompts';
import { InternalError } from '@src/Errors/InternalError';
import pMap from 'p-map';
import { logger } from '@src/Libs/Logger';
import { cpus } from 'node:os';



export type AppConfig = {
	db_file_path: string;
	close_browser_after_login: boolean;
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

		const mapper = async (account: Account) => {
			const browser = new Browser({
				...account,
				rabbyPassword: walletsPassword,
				adsApiBaseURL: this.config.ads_power_api_url,
				chromeExtId: this.config.chrome_extension_id,
			});

			try {
				await browser.process();

				if (this.config.close_browser_after_login) {
					await browser.close();
				}
			} catch (error) {
				logger.error(error, 'account_process_error', { user_id: account.adsUserId });
			}
		};

		await pMap(accounts, mapper, { concurrency });
	}
}
