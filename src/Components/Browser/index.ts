import { type BrowserContext, type Page, chromium } from 'playwright';
import { AdsPowerApi } from '@src/Components/AdsPowerApi';
import { InternalError } from '@src/Errors/InternalError';
import { sleep } from '@src/Helpers/index';
import { logger } from '@src/Libs/Logger';

export type Account = {
	accountNumber: number;
	privateKey: string;
	adsUserId: string;
};

type BrowserConfig = Account & {
	adsApiBaseURL: string;
	rabbyPassword: string;
	chromeExtId: string;
};

export class Browser {
	private readonly config: BrowserConfig;
	private readonly adsApi: AdsPowerApi;
	private readonly logData: Record<string, unknown>;
	private browser?: BrowserContext;

	public constructor(config: BrowserConfig) {
		this.config = config;

		this.logData = {
			user_id: this.config.adsUserId,
			user_number: this.config.accountNumber,
			ext_id: this.config.chromeExtId,
			base_url: this.config.adsApiBaseURL,
		};

		this.adsApi = new AdsPowerApi({
			baseURL: this.config.adsApiBaseURL,
		});
	}

	private async waitIfPageNotLoaded(page: Page, evaluation: string) {
		const getNeedToWait = async () => {
			try {
				await page.evaluate("document.querySelector('body')");
				return false;
			} catch {
				return true;
			}
		};

		const timeout = 1000 * 30;

		if (await getNeedToWait()) {
			logger.info({ code: 'page_not_loaded_load_state', data: { ...this.logData, page: page.url(), evaluation } });
			await page.waitForLoadState('load', { timeout });
			await page.waitForLoadState('domcontentloaded', { timeout });
			await page.waitForURL(page.url(), { timeout });
		}
	}

	private async evaluate(page: Page, evaluation: string) {
		await this.waitIfPageNotLoaded(page, evaluation);

		return page.evaluate(evaluation);
	}

	private getVisibleElementSelector(selector: string) {
		return selector.includes('document.querySelector')
			? selector
			: `[...document.querySelectorAll('${selector}')].find(n => n.checkVisibility())`;
	}

	private async isVisible(page: Page, selector: string) {
		try {
			return await this.evaluate(page, this.getVisibleElementSelector(selector));
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			logger.error(error, 'browser_error_visible');
			throw error;
		}
	}

	private async clickIfVisible(page: Page, selector: string) {
		try {
			const elementSelector = this.getVisibleElementSelector(selector);

			await this.waitIfPageNotLoaded(page, elementSelector);

			if (!(await this.evaluate(page, elementSelector))) {
				return;
			}

			await this.evaluate(page, `${elementSelector}?.click()`);

			await sleep(1000 * 1);

			await page.waitForLoadState('domcontentloaded');

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			logger.error(error, 'browser_error_click');
			throw error;
		}
	}

	private async type(page: Page, selector: string, text: string) {
		try {
			const elementSelector = this.getVisibleElementSelector(selector);

			await this.waitIfPageNotLoaded(page, elementSelector);

			if (!(await this.evaluate(page, elementSelector))) {
				return;
			}

			await page.type(selector, text);

			await this.evaluate(page, `${elementSelector}?.blur()`);

			await sleep(1000 * 1);

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			logger.error(error, 'browser_error_type');
			throw error;
		}
	}

	private async goto(page: Page, url: string) {
		await page.goto(url, { waitUntil: 'domcontentloaded' });

		await sleep(5000);
	}

	private getDocumentSelectorWitInnerText(selector: string, text: string) {
		return `[...document.querySelectorAll('${selector}')].find(node => node.innerText === '${text}')`;
	}

	private async clickByInnerText(page: Page, selector: string, text: string) {
		await this.clickIfVisible(page, this.getDocumentSelectorWitInnerText(selector, text));
	}

	public async process() {
		logger.info({ code: 'account_process_started', data: this.logData });

		const cdpSessionURL = await this.adsApi.startProfile(this.config.adsUserId);

		const browser = await chromium.connectOverCDP(cdpSessionURL);
		this.browser = browser.contexts()[0];

		const page = await this.browser.newPage();

		logger.info({ code: 'account_process_started_browser', data: this.logData });

		const baseExtensionUrl = `chrome-extension://${this.config.chromeExtId}/index.html#`;
		const importUrl = `${baseExtensionUrl}/import/key`;

		await this.goto(page, importUrl);

		logger.info({ code: 'account_process_went_to_page', data: this.logData });

		await page.bringToFront();

		await this.clickByInnerText(page, 'button', 'Next');
		await this.clickByInnerText(page, 'button', 'Get Started');
		await this.clickByInnerText(page, 'div', 'Import Private Key');

		if (await this.isVisible(page, '#password')) {
			await this.type(page, '#password', this.config.rabbyPassword);

			if (await this.isVisible(page, '#confirmPassword')) {
				await this.type(page, '#confirmPassword', this.config.rabbyPassword);
				logger.info({ code: 'account_process_password_setup_needed', data: this.logData });
			} else {
				logger.info({ code: 'account_process_password_unlock_needed', data: this.logData });
			}

			await this.clickByInnerText(page, 'button', 'Next');
			await this.clickByInnerText(page, 'button', 'Unlock');

			logger.info({ code: 'account_process_password_done', data: this.logData });
		}

		await this.goto(page, importUrl);

		logger.info({ code: 'account_process_went_to_page_second', data: this.logData });

		if (!(await this.isVisible(page, '#key'))) {
			throw new InternalError({ code: 'account_process_no_private_key_input', data: this.logData });
		}

		await this.evaluate(page, "document.querySelector('#key').value = ''");
		await this.type(page, '#key', this.config.privateKey);
		await this.clickByInnerText(page, 'button', 'Confirm');

		logger.info({ code: 'account_process_private_key_done', data: this.logData });

		const alreadyBeenImportedSelector = `[...document.querySelectorAll('span[class="ant-modal-confirm-title"]')].find(node => node.innerText.includes('has been imported'))`;

		if (await this.isVisible(page, alreadyBeenImportedSelector)) {
			logger.info({ code: 'account_process_already_imported', data: this.logData });

			await this.clickByInnerText(page, 'div', 'Import Private Key');
			await this.clickByInnerText(page, 'div.ant-modal-confirm-btns button', 'Confirm');

			logger.info({ code: 'account_process_already_imported_done', data: this.logData });
		}

		if (await this.isVisible(page, 'input[class="ant-input"]')) {
			logger.info({ code: 'account_process_naming_started', data: this.logData });

			await this.evaluate(page, "document.querySelector('input[class=\"ant-input\"]').value = ''");
			await this.type(page, 'input[class="ant-input"]', `#${this.config.accountNumber}`);
			await this.clickByInnerText(page, 'button', 'Done');

			logger.info({ code: 'account_process_naming_done', data: this.logData });
		}

		logger.info({ code: 'account_process_done', data: this.logData });
	}

	public async close() {
		logger.info({ code: 'account_process_close_browser_start', data: this.logData });

		await this.adsApi.stopProfile(this.config.adsUserId);
		await this.browser?.close();

		logger.info({ code: 'account_process_close_browser_done', data: this.logData });
	}
}
