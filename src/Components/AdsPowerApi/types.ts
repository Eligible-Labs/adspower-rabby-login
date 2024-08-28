export type BaseResponse = {
	code: 0 | -1;
	msg: 'success' | 'failed';
};

export type StartProfileRequest = {
	user_id: string;
};

export type StartProfileResponse = BaseResponse & {
	data?: {
		ws: {
			selenium: string;
			puppeteer: string;
		};
		debug_port: string;
		webdriver: string;
	};
};

export type FindProfilesRequest = {
	user_id: string;
	page: number;
	page_size: number;
};

export type FindProfilesResponse = BaseResponse & {
	data?: {
		list: [
			{
				name: string;
				domain_name: string;
				created_time: string;
				ip: string;
				ip_country: string;
				password: string;
				fbcc_proxy_acc_id: string;
				ipchecker: string;
				fakey: string;
				sys_app_cate_id: string;
				group_id: string;
				group_name: string;
				remark: string;
				serial_number: string;
				last_open_time: string;
				user_id: string;
				username: string;
			},
		];
		page: number;
		page_size: number;
	};
};
