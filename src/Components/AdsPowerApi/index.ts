import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { InternalError } from '@src/Errors/InternalError';
import { logger } from '@src/Libs/Logger';
import type { CreateProfileRequest, CreateProfileResponse, FindProfilesRequest, FindProfilesResponse, StartProfileRequest, StartProfileResponse } from './types';
import { ProxyConfig } from '@src/Helpers';

type AdsPowerConfig = {
	baseURL: string;
};

export class AdsPowerApi {
	private readonly api: AxiosInstance;

	constructor(config: AdsPowerConfig) {
		this.api = axios.create(config);
	}

	public async createProfile(proxy: ProxyConfig) {
		const data: CreateProfileRequest = {
			group_id: '0',
			fingerprint_config: {
				automatic_timezone: '1',
				random_ua: {
					ua_system_version: ['Windows 10', 'Windows 11'],
				},
				webrtc: 'forward',
			},
			user_proxy_config: {
				proxy_soft: 'other',
				proxy_type: 'http',
				proxy_host: proxy.host,
				proxy_port: proxy.port,
				proxy_user: proxy.user,
				proxy_password: proxy.password,
			},
		};

		const logData: Record<string, unknown> = { params: data };

		logger.info({ code: 'ads_power_api_create_profile_request', data: logData });

		const { data: response } = await this.api.post<CreateProfileResponse>('/api/v1/user/create', data);

		logData.response = response;

		logger.info({ code: 'ads_power_api_create_profile_response', data: logData });

		if (response.code !== 0 || !response.data)
			throw new InternalError({ message: 'Ads Power profile create error', data: logData });

		logger.info({ code: 'ads_power_api_create_profile_done', data: logData });

		return response.data.id;
	}

	public async startProfile(userId: string) {
		const params: StartProfileRequest = { user_id: userId };

		const logData: Record<string, unknown> = { user_id: userId };

		logger.info({ code: 'ads_power_api_start_profile_request', data: logData });

		const { data: response } = await this.api.get<StartProfileResponse>('/api/v1/browser/start', { params });

		logData.response = response;

		logger.info({ code: 'ads_power_api_start_profile_response', data: logData });

		if (response.code !== 0 || !response.data) {
			throw new InternalError({ message: 'Ads Power profile start error', data: logData });
		}

		logger.info({ code: 'ads_power_api_start_profile_done', data: logData });

		return response.data.ws.puppeteer;
	}

	public async stopProfile(userId: string) {
		const params: StartProfileRequest = { user_id: userId };

		const logData: Record<string, unknown> = { user_id: userId };

		logger.info({ code: 'ads_power_api_stop_profile_request', data: logData });

		const { data: response } = await this.api.get<StartProfileResponse>('/api/v1/browser/stop', { params });

		logData.response = response;

		logger.info({ code: 'ads_power_api_stop_profile_response', data: logData });

		if (response.code !== 0 || !response.data) {
			throw new InternalError({ message: 'Ads Power profile stop error', data: logData });
		}

		logger.info({ code: 'ads_power_api_stop_profile_done', data: logData });

		return response.data.ws.puppeteer;
	}

	public async findProfiles(userIds: string[]) {
		const params: FindProfilesRequest = {
			user_id: userIds.join(','),
			page_size: userIds.length,
			page: 1,
		};

		const logData: Record<string, unknown> = { params };

		logger.info({ code: 'ads_power_api_find_profiles_request', data: logData });

		const { data: response } = await this.api.get<FindProfilesResponse>('/api/v1/user/list', { params });

		logData.found = response?.data?.list?.length;

		logger.info({ code: 'ads_power_api_find_profiles_response', data: logData });

		if (response.code !== 0) {
			logData.response = response;

			throw new InternalError({ message: 'Ads Power find profiles error', data: logData });
		}

		logger.info({ code: 'ads_power_api_find_profiles_done', data: logData });

		return response.data?.list.map(({ user_id }) => user_id) || [];
	}
}
