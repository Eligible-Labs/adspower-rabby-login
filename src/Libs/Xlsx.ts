import { readFile, stat } from 'node:fs/promises';
import officeCrypto from 'officecrypto-tool';
import XLSX from 'xlsx';
import { InternalError } from '@src/Errors/InternalError';

type GetContentOptions = {
	headers: string[];
};

class Xlsx {
	async validateFilePath(path: string) {
		try {
			await stat(path);
			return true;
		} catch {
			return false;
		}
	}

	async validateFilePassword(path: string, password: string) {
		try {
			await this.getBufferByPath(path, password);
			return true;
		} catch {
			return false;
		}
	}

	async getContent<Row = Record<string, unknown>>(path: string, password: string, options: GetContentOptions): Promise<Row[]> {
		const buffer = await this.getBufferByPath(path, password);

		const workbook = XLSX.read(buffer);
		const {
			SheetNames: [sheetName],
		} = workbook;

		const data = XLSX.utils.sheet_to_json<Row[]>(workbook.Sheets[sheetName], { header: 1 });

		return data.map((row) => {
			const values = [...row];

			const rowWithHeaderNames = options.headers.reduce((resultObj: Record<string, unknown>, headerName) => {
				resultObj[headerName] = values.shift();
				return resultObj;
			}, {});

			return rowWithHeaderNames as Row;
		});
	}

	private async getBufferByPath(path: string, password?: string) {
		const fileData = await readFile(path);
		const isEncrypted = officeCrypto.isEncrypted(fileData);

		if (!isEncrypted) {
			return fileData;
		}

		if (!password) {
			throw new InternalError({ code: 'xlsx_password_required', data: { path } });
		}

		const decryptedFileData = await officeCrypto.decrypt(fileData, { password });

		return decryptedFileData;
	}
}

export const xlsx = new Xlsx();
