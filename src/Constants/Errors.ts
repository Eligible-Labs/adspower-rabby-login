export enum InternalErrorCodes {
	fileInvalidBody = 'file_invalid_body',
	fileAdsNotFound = 'file_ads_not_found',
	fileAccountNotFound = 'file_account_not_found',
	fileNoAccounts = 'file_no_accounts',
}

export const INTERNAL_ERROR_MESSAGES: Record<InternalErrorCodes, string> = {
	[InternalErrorCodes.fileInvalidBody]: 'В файле присутствуют ошибки',
	[InternalErrorCodes.fileAdsNotFound]: 'Не найдены профили в Ads Power',
	[InternalErrorCodes.fileAccountNotFound]: 'Не найдены номера аккаунтов в файле',
	[InternalErrorCodes.fileNoAccounts]: 'Аккаунты не найдены',
}