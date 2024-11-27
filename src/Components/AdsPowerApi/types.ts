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

export type CreateProfileResponse = BaseResponse & {
	data?: {
		id: string;
	};
};

export type CreateProfileRequest = {
	name?: string; // The name of the account, limited to 100 characters
	domain_name?: string; // Domain name of the user's account platform
	open_urls?: string[]; // List of URLs to open in the browser
	repeat_config?: number[]; // Configuration for account deduplication, see below for details
	username?: string; // Username for login, optional if cookie or password is provided
	fakey?: string; // 2FA key for additional security
	cookie?: Array<{
		domain: string;
		expirationDate?: string;
		name?: string;
		path: string;
		sameSite?: string;
		secure?: boolean;
		value?: string;
		id: number;
	}>; // Array of cookie objects, used for login sessions
	ignore_cookie_error?: 0 | 1; // Whether to ignore cookie verification errors (0: No, 1: Yes)
	group_id: string; // Identifier for grouping accounts, "0" for default
	ip?: string; // Proxy IP address for login
	country?: string; // Country code associated with the IP
	region?: string; // Region or state associated with the IP
	city?: string; // City associated with the IP
	remark?: string; // Remarks or notes about the account
	ipchecker?: 'ip2location' | 'ipapi'; // Service used for IP verification
	sys_app_cate_id?: number; // Application category ID for system purposes
	user_proxy_config?: {
		proxy_soft: '922S5auto' | 'ipfoxyauto' | 'ipideaauto' | 'kookauto' | 'lumauto' | 'luminati' | 'nopoxy' | 'other' | 'oxylabsauto' | 'ssh';
		proxy_type?: 'http' | 'https' | 'socks5';
		proxy_host?: string;
		proxy_port?: string;
		proxy_user?: string;
		proxy_password?: string;
		proxy_url?: string;
		global_config?: 0 | 1;
	}; // Configuration object for proxy settings
	proxyid?: string; // Alternative proxy identifier
	fingerprint_config: {
		automatic_timezone?: '0' | '1'; // Automatic timezone generation based on IP (1: Yes, 0: No)
		webrtc?: 'disabled' | 'forward' | 'proxy' | 'real'; // WebRTC configuration, controls IP leakage
		timezone?: string; // Custom timezone string
		location?: 'allow' | 'ask' | 'block'; // Location permission setting
		location_switch?: '0' | '1'; // Whether to generate location based on IP (1: Yes, 0: No)
		longitude?: string; // Custom longitude for location
		latitude?: string; // Custom latitude for location
		accuracy?: number; // Accuracy of the custom location in meters
		language?: string[]; // Array of preferred languages for the browser
		language_switch?: '0' | '1'; // Switch to enable language based on IP country (0: Off, 1: On)
		page_language_switch?: '0' | '1'; // Match interface language based on preferred languages (0: Disabled, 1: Enabled)
		page_language?: string; // Default page language
		ua?: string; // User-Agent string, can be customized
		screen_resolution?: string; // Screen resolution (width_height)
		fonts?: string[]; // List of fonts to be used by the browser
		canvas?: '0' | '1'; // Canvas fingerprinting configuration (1: Add noise, 0: Default)
		webgl_image?: '0' | '1'; // WebGL image fingerprinting (1: Add noise, 0: Default)
		webgl?: '0' | '2' | '3'; // WebGL metadata fingerprinting (0: Default, 2: Custom, 3: Random)
		webgl_config?: {
			unmasked_vendor?: string;
			unmasked_renderer?: string;
			webgpu?: {
				webgpu_switch: '0' | '1';
			};
		}; // Custom WebGL configuration for browser fingerprinting
		audio?: '0' | '1'; // Audio fingerprinting configuration (1: Add noise, 0: Default)
		do_not_track?: 'default' | 'false' | 'true'; // Do Not Track configuration
		hardware_concurrency?: '16' | '2' | '4' | '6' | '8'; // Number of CPU cores to simulate
		device_memory?: '16' | '2' | '4' | '8'; // Amount of device memory to simulate
		flash?: 'allow' | 'block'; // Flash configuration
		scan_port_type?: '0' | '1'; // Port scan protection (1: Enable, 0: Disable)
		allow_scan_ports?: string[]; // List of ports allowed for scanning when protection is enabled
		media_devices?: '0' | '1' | '2'; // Media device configuration (0: Default, 1: Noise, 2: Custom)
		media_devices_num?: {
			audioinput_num: string;
			videoinput_num: string;
			audiooutput_num: string;
		}; // Custom number of media devices
		client_rects?: '0' | '1'; // ClientRects noise generation (0: Default, 1: Add noise)
		device_name_switch?: '0' | '1' | '2'; // Device name masking (0: Off, 1: Mask, 2: Custom)
		device_name?: string; // Custom device name
		random_ua?: {
			ua_browser?: string[];
			ua_version?: string[];
			ua_system_version?: string[];
		}; // Random User-Agent configuration for browser, OS, and version
		speech_switch?: '0' | '1'; // Speech synthesis voices configuration (0: Default, 1: Custom)
		mac_address_config?: {
			model: '0' | '1' | '2';
			address: string;
		}; // MAC address configuration
		browser_kernel_config?: {
			version: '92' | '99' | 'ua_auto';
			type: 'chrome' | 'firefox';
		}; // Browser kernel version configuration
		gpu?: '0' | '1' | '2'; // GPU hardware acceleration configuration (0: Default, 1: On, 2: Off)
	}; // Configuration object for browser fingerprinting
};