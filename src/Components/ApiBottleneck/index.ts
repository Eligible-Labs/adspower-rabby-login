import httpProxy from 'http-proxy';
import http from 'http';
import { randomUUID } from 'node:crypto';
import { sleep } from '@src/Helpers';
import { logger } from '@src/Libs/Logger';

const DELAY = 1000;
const PORT = 50326;

type QueueItem = { requestId: string, url: string, date: number }

export class ApiBottleneck {
    private queue: QueueItem[]
    private lastRequestStartedAt: number
    private readonly target: string
    public readonly endpoint: string

    public constructor(target: string) {
        this.queue = [];
        this.lastRequestStartedAt = 0;
        this.target = target;
        this.endpoint = `http://localhost:${PORT}`;
    }

    public async initServer() {
        const proxy = httpProxy.createProxyServer({ target: this.target });

        proxy.on('error', (error, _, res) => {
            logger.error(error, 'bottleneck_proxy_error');
            res.end();
        });

        http.createServer(async (req, res) => {
            const reqId = randomUUID();

            this.queue.push({ requestId: reqId, url: req.url!, date: Date.now() });

            while ((this.queue[0]?.requestId !== reqId || (Date.now() - this.lastRequestStartedAt) < DELAY) && this.lastRequestStartedAt) {
                await sleep(100);
            }

            this.lastRequestStartedAt = Date.now();

            proxy.web(req, res, { target: this.target });

            this.queue = this.queue.filter(({ requestId }) => reqId !== requestId);
        }).listen(PORT);
    }
}


