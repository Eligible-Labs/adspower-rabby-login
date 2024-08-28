import type { Account } from '@src/Components/Browser';
import { validatePrivateKey } from '@src/Helpers/index';
import { xlsx } from '@src/Libs/Xlsx';

type AccountError = {
	errors: string[];
	rowNumber: number;
};

export class Validators {
	public static async dbFilePath(path: string) {
		const isValid = await xlsx.validateFilePath(path);

		return isValid || 'Файл не найден';
	}

	public static async dbFilePassword(path: string, password: string) {
		const isValid = await xlsx.validateFilePassword(path, password);

		return isValid || 'Неверный пароль';
	}

	public static accounts(accountsInput: Account[]): { accounts: Account[]; errors: AccountError[] } {
		const errors: AccountError[] = [];

		const adsUserIds = new Set<string>();
		const privateKeys = new Set<string>();
		const accountNumbers = new Set<number>();

		const accounts = accountsInput
			.map((account, index) => {
				const rowErrors: string[] = [];

				const accountNumber = account.accountNumber ? Number(account.accountNumber) : null;
				const privateKey = account.privateKey ? String(account.privateKey).trim() : null;
				const adsUserId = account.adsUserId ? String(account.adsUserId).trim() : null;

				if (!(privateKey || adsUserId || accountNumber)) {
					return null;
				}

				if (!accountNumber) {
					rowErrors.push('Отсутствует номер аккаунта');
				} else if (accountNumbers.has(accountNumber)) {
					rowErrors.push('Дубликат номера аккаунта');
				} else {
					accountNumbers.add(accountNumber);
				}

				if (!privateKey) {
					rowErrors.push('Отсутствует приватный ключ');
				} else if (!validatePrivateKey(privateKey)) {
					rowErrors.push('Некорректный приватный ключ');
				} else if (privateKeys.has(privateKey)) {
					rowErrors.push('Дубликат приватного ключа');
				} else {
					privateKeys.add(privateKey);
				}

				if (!adsUserId) {
					rowErrors.push('Отсутствует ADS id');
				} else if (adsUserId.length < 5) {
					rowErrors.push('Некорректный ADS id');
				} else if (adsUserIds.has(adsUserId)) {
					rowErrors.push('Дубликат ADS id');
				} else {
					adsUserIds.add(adsUserId);
				}

				if (rowErrors.length > 0) {
					errors.push({ rowNumber: index + 2, errors: rowErrors });

					return null;
				}

				return {
					accountNumber,
					privateKey,
					adsUserId,
				};
			})
			.filter(Boolean) as Account[];

		return { accounts, errors };
	}

	public static password(input: string, typedPassword?: string) {
		if (typedPassword && input !== typedPassword) {
			return 'Пароли не совпадают';
		}

		if (input.length < 8) {
			return 'Пароль должен содержать 8 и более символов';
		}

		return true;
	}
}
