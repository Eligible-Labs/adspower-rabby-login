import { logger } from '@src/Libs/Logger';
// biome-ignore lint/nursery/useImportRestrictions: <explanation>
import { App } from './src/App.js';

const app = new App({
	/**
	 * Путь до файла с приватными ключами
	 */
	db_file_path: './docs/db-example.xlsx',
	/**
	 * Номер строки для логина
	 * 'all' - Все числа подходят
	 * 10 - Подходят только числа равные 10 
	 * [0, 10, 15] - Подходят только числа 0, 10, 15 
	 * [[0, 15], [20, 25], [50, 100]] - Подходят только числа от 0 до 10, от 20 до 25 и от 50 до 100
	 */
	rows_to_login: 'all',
	/**
	 * Номера строк для исключения из обработки
	 * 'all' - Все числа не подходят
	 * 0 - Ничего не игнорируется (нулевой строки не существует)
	 * 10 - Не подходят только числа равные 10 
	 * [5, 10, 15] - Не подходят только числа 5, 10, 15 
	 * [[0, 15], [20, 25], [50, 100]] - Не подходят только числа от 0 до 10, от 20 до 25 и от 50 до 100
	 */
	rows_to_ignore: 0,
	/**
	 * Закрывать ли браузер после логина кошелька
	 */
	close_browser_after_login: false,
	/**
	 * Количество параллельно запускаемых браузеров
	 * 'auto' если определять автоматически по CPU
	 */
	concurrency: 2,
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
