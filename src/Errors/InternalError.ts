import { INTERNAL_ERROR_MESSAGES, type InternalErrorCodes } from '@src/Constants/Errors';
import type { AxiosError } from 'axios';

type DataType = {
	code?: string;
	message?: string;
	stack?: string;
	data?: Record<string, unknown>;
};

type LogDataType = {
	code: string;
	message: string;
	data: Record<string, unknown>;
	stack: string;
};

export class InternalError extends Error {
	public override message: string;
	public code: string;
	public data: Record<string, unknown>;

	public constructor({ code = 'internal_error', message = 'Internal error', data, stack }: DataType = {}) {
		super(message);

		this.stack = stack || this.stack;
		this.code = code;
		this.message = message;
		this.data = data || {};

		if (code in INTERNAL_ERROR_MESSAGES) {
			this.message = INTERNAL_ERROR_MESSAGES[code as InternalErrorCodes];
		}
	}

	public get logData(): LogDataType {
		const { message, code, data, stack = '' } = this;

		return { code, message, data, stack };
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public static wrapError(error: any | AxiosError | Error, code = 'unexpected_error', data = {}) {
		if (error instanceof InternalError) {
			return error;
		}

		if ((error as AxiosError).isAxiosError) {
			const { request, response } = error as AxiosError;

			return new InternalError({
				code: 'axios_request_error',
				message: 'Axios error',
				data: {
					...data,
					url: request?.path,
					status: response?.status,
					responseBody: response?.data,
				},
				stack: error.stack,
			});
		}

		return new InternalError({
			code,
			data,
			message: error.message,
			stack: error.stack,
		});
	}
}
