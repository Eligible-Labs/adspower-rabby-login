import { type Logger as LoggerType, createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { InternalError } from '@src/Errors/InternalError';

const { Console } = transports;

type WinstonLogType = {
	message: Record<string, unknown>;
	level: string;
	[key: string | symbol]: unknown;
};

export type LogType = {
	code?: string;
	message?: string;
	data?: Record<string, unknown>;
	stack?: string;
};

const getInternalError = (logData: WinstonLogType): InternalError => {
	if (logData instanceof Error) {
		return InternalError.wrapError(logData);
	}

	if (logData.message instanceof Error) {
		return InternalError.wrapError(logData.message);
	}

	return new InternalError(typeof logData.message === 'string' ? logData : logData.message);
};

export const errorFormatter = (logData: WinstonLogType) => {
	if (logData.level === 'error') {
		const internalError = getInternalError(logData);

		return {
			level: logData.level,
			message: internalError.logData,
		};
	}

	const message = Object.keys(logData).reduce((resultObj: Record<string, unknown>, key) => {
		if (key !== 'level') {
			resultObj[key] = logData[key];
		}

		return resultObj;
	}, {});

	return {
		message,
		level: logData.level,
	};
};

export const additionalDataSetter = (logData: WinstonLogType) => {
	const message = {
		...logData.message,
		pid: process.pid,
		date_time: new Date().toJSON(),
	};

	const { level } = logData;

	return {
		message,
		level,
		[Symbol.for('message')]: JSON.stringify({ level, ...message }),
		[Symbol.for('level')]: level,
	};
};

class Logger {
	private readonly logger: LoggerType;

	public constructor() {
		this.logger = createLogger({
			levels: { error: 5, warn: 3, info: 1 },
			format: this.getFormat(),
			transports: this.getTransports(),
		});
	}

	public error(log: Error | LogType | unknown, code?: string, data = {}): LoggerType {
		if (log instanceof Error) {
			return this.logger.error(InternalError.wrapError(log, code, data));
		}

		return this.logger.error(log);
	}

	public info(log: LogType | string) {
		return this.logger.info(log);
	}

	public warn(log: LogType | string) {
		return this.logger.warn(log);
	}

	private getFormat() {
		return format.combine(format(errorFormatter)(), format(additionalDataSetter)());
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private getConsoleMessage(info: any) {
		let message = '';

		if (typeof info.message.message === 'string') {
			message = info.message.message;
		} else if (typeof info.message.message.message === 'string') {
			message = info.message.message.message;
		}

		if (typeof info.message.code === 'string') {
			message += ` [${info.message.code}]`
		} else if (typeof info.message.message.code === 'string') {
			message += ` [${info.message.message.code}]`
		}

		if (info.message.data?.user_id) {
			message += ` [ads_id: ${info.message.data?.user_id}]`
		} else if (info.message.message?.data?.user_id) {
			message += ` [ads_id: ${info.message.message?.data?.user_id}]`
		}

		return message.trim();
	}

	private getTransports() {
		const consoleTransport = new Console({
			format: format.combine(
				format.colorize(),
				format.printf((info) => `${info.level}: ${this.getConsoleMessage(info)}`),
			),
			level: 'error',
			handleExceptions: false,
			handleRejections: false,
		});

		const fileTransport = new DailyRotateFile({
			dirname: 'log',
			filename: './%DATE%',
			extension: '.log',
			datePattern: 'YYYY-MM-DD',
			maxSize: '14m',
			level: 'error',
			utc: true,
		});

		return [consoleTransport, fileTransport];
	}
}

export const logger = new Logger();
