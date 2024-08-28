import { logger } from '@src/Libs/Logger';
// biome-ignore lint/nursery/useImportRestrictions: <explanation>
import { App } from './src/App.js';

const app = new App({
	/**
	 * Путь до файла с приватными ключами
	 */
	db_file_path: './docs/db-example.xlsx',
	/**
	 * Аккаунты для логина
	 * 'all' если все
	 *  number[] для логина конкретных кошельков, например: [1, 4, 181, 123]
	 */
	accounts_to_login: 'all',
	/**
	 * Закрывать ли браузер после логина кошелька
	 */
	close_browser_after_login: false,
	/**
	 * Количество параллельно запускаемых браузеров
	 * 'auto' если определять автоматически по CPU
	 */
	concurrency: 'auto',
	/**
	 * ID расширения Rabby в браузерe
	 * Установка https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch
	 * ID в таком случае будет: acmacodkjbdgmoleebolmdjonilkdbch
	 */
	chrome_extension_id: 'bgffghflpnclmknlifjfondjbbclhgdk',
	/**
	 * URL API ADS Power
	 */
	ads_power_api_url: 'http://localhost:50325',
});

void app.start().catch((e) => logger.error(e, 'app_bootstrap_error'));
