import {test as base, expect} from '@playwright/test';
import {spawn, execSync, type ChildProcess} from 'child_process';
import {resolve, join} from 'path';
import {existsSync} from 'fs';

const SERVER_DIR = resolve(__dirname, '../server');
const VENV_DIR = join(SERVER_DIR, '.venv');
const VENV_BIN = join(VENV_DIR, 'bin');
const PYTHON = join(VENV_BIN, 'python3');
const HYPERCORN = join(VENV_BIN, 'hypercorn');

const DEFAULT_PORT = 5050;
const DEFAULT_WS_PORT = 5150;

interface WorkerBackend {
    apiUrl: string;
    wsUrl: string;
    port: number;
    wsPort: number;
    workerIndex: number;
}

interface BackendApi {
    resetApp(profile: string): Promise<void>;
    addItems(resource: string, items: Array<any>): Promise<void>;
    forceUnlockItem(itemType: string, itemId: string): Promise<void>;
}

function assertVenvExists(): void {
    if (!existsSync(PYTHON)) {
        throw new Error(
            `Python venv not found at ${VENV_DIR}. Run 'npm run e2e:setup' first.`,
        );
    }
}

async function waitForHealthy(url: string, timeoutMs = 60_000): Promise<void> {
    const start = Date.now();
    let delay = 500;

    while (Date.now() - start < timeoutMs) {
        try {
            const resp = await fetch(url, {signal: AbortSignal.timeout(2000)});
            if (resp.ok) return;
        } catch {
            // not ready yet
        }
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.5, 3000);
    }

    throw new Error(`Backend at ${url} did not become healthy within ${timeoutMs}ms`);
}

function buildWorkerEnv(idx: number): Record<string, string> {
    const port = DEFAULT_PORT + idx;
    const wsPort = DEFAULT_WS_PORT + idx;
    const redisDb = idx + 1;

    return {
        ...process.env as Record<string, string>,
        PORT: String(port),
        WSPORT: String(wsPort),
        MONGO_DBNAME: `e2e_superdesk_w${idx}`,
        MONGO_URI: `mongodb://localhost/e2e_superdesk_w${idx}`,
        ARCHIVED_DBNAME: `e2e_archived_w${idx}`,
        ARCHIVED_MONGO_URI: `mongodb://localhost/e2e_archived_w${idx}`,
        ELASTICSEARCH_URL: 'http://localhost:9200',
        ELASTICSEARCH_INDEX: `superdesk_e2e_w${idx}`,
        REDIS_URL: `redis://localhost:6379/${redisDb}`,
        CELERY_BROKER_URL: `redis://localhost:6379/${redisDb}`,
        SECRET_KEY: 'e2e',
        DEFAULT_TIMEZONE: process.env.TZ || 'Australia/Sydney',
        WEB_CONCURRENCY: '1',
        // Ensure venv Python is first on PATH for any subprocess
        PATH: `${VENV_BIN}:${process.env.PATH || ''}`,
    };
}

function initializeDatabase(env: Record<string, string>): void {
    execSync(
        `${PYTHON} manage.py -A app:get_app app:initialize_data`,
        {cwd: SERVER_DIR, env, stdio: 'pipe', timeout: 60_000},
    );
}

function spawnHypercorn(env: Record<string, string>): ChildProcess {
    const port = env.PORT;
    const proc = spawn(
        HYPERCORN,
        ['-c', 'file:hypercorn_config.py', 'wsgi:application'],
        {cwd: SERVER_DIR, env, stdio: 'pipe'},
    );

    proc.on('error', (err) => {
        console.error(`[worker:${port}] Hypercorn error: ${err.message}`);
    });

    return proc;
}

function spawnWebSocket(env: Record<string, string>): ChildProcess {
    const wsPort = env.WSPORT;
    const proc = spawn(
        PYTHON,
        ['-u', 'ws.py'],
        {cwd: SERVER_DIR, env, stdio: 'pipe'},
    );

    proc.on('error', (err) => {
        console.error(`[worker:${wsPort}] WebSocket error: ${err.message}`);
    });

    return proc;
}

async function killProcess(proc: ChildProcess): Promise<void> {
    proc.kill('SIGTERM');
    await new Promise<void>((res) => {
        const timer = setTimeout(() => {
            proc.kill('SIGKILL');
            res();
        }, 5_000);

        proc.on('exit', () => {
            clearTimeout(timer);
            res();
        });
    });
}

function cleanupWorkerData(idx: number): void {
    const dbName = `e2e_superdesk_w${idx}`;
    const archivedDbName = `e2e_archived_w${idx}`;
    const esIndex = `superdesk_e2e_w${idx}`;
    const redisDb = idx + 1;

    try {
        execSync(
            `mongosh --quiet --eval "db.getSiblingDB('${dbName}').dropDatabase(); db.getSiblingDB('${archivedDbName}').dropDatabase();"`,
            {stdio: 'pipe', timeout: 10_000},
        );
    } catch { /* best effort */ }

    try {
        fetch(`http://localhost:9200/${esIndex}`, {method: 'DELETE'}).catch(() => {});
    } catch { /* best effort */ }

    try {
        execSync(`redis-cli -n ${redisDb} FLUSHDB`, {stdio: 'pipe', timeout: 5_000});
    } catch { /* best effort */ }
}

export const test = base.extend<{backendApi: BackendApi}, {workerBackend: WorkerBackend}>({
    workerBackend: [async ({}, use, workerInfo) => {
        assertVenvExists();

        const idx = workerInfo.workerIndex;
        const port = DEFAULT_PORT + idx;
        const wsPort = DEFAULT_WS_PORT + idx;
        const env = buildWorkerEnv(idx);

        initializeDatabase(env);

        const hypercornProc = spawnHypercorn(env);
        const wsProc = spawnWebSocket(env);

        try {
            await waitForHealthy(`http://localhost:${port}/api`);

            await use({
                apiUrl: `http://localhost:${port}/api`,
                wsUrl: `ws://localhost:${wsPort}`,
                port,
                wsPort,
                workerIndex: idx,
            });
        } finally {
            await Promise.all([killProcess(hypercornProc), killProcess(wsProc)]);
            cleanupWorkerData(idx);
        }
    }, {scope: 'worker', timeout: 120_000}],

    page: async ({page, workerBackend}, use) => {
        // The frontend build has the API port baked in (typically 5000).
        // Intercept those requests and redirect to this worker's actual port.
        const BAKED_IN_PORT = process.env.SUPERDESK_BAKED_PORT || '5050';

        if (String(workerBackend.port) !== BAKED_IN_PORT) {
            await page.route(
                (url) => url.hostname === 'localhost' && url.port === BAKED_IN_PORT,
                async (route) => {
                    const url = new URL(route.request().url());
                    url.port = String(workerBackend.port);
                    await route.continue({url: url.toString()});
                },
            );
        }

        await page.addInitScript(({apiUrl, wsUrl}) => {
            localStorage.setItem('TEST_APP_CONFIG', JSON.stringify({
                server: {url: apiUrl, ws: wsUrl},
            }));
        }, {apiUrl: workerBackend.apiUrl, wsUrl: workerBackend.wsUrl});

        await use(page);
    },

    backendApi: async ({workerBackend}, use) => {
        const api: BackendApi = {
            async resetApp(profile: string) {
                const resp = await fetch(`${workerBackend.apiUrl}/prepopulate`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({profile, remove_first: true}),
                });
                if (!resp.ok) {
                    throw new Error(`resetApp failed: ${resp.status} ${await resp.text()}`);
                }
            },

            async addItems(resource: string, items: Array<any>) {
                const resp = await fetch(`${workerBackend.apiUrl}/planning_prepopulate`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({resource, items}),
                });
                if (!resp.ok) {
                    throw new Error(`addItems(${resource}) failed: ${resp.status} ${await resp.text()}`);
                }
            },

            async forceUnlockItem(itemType: string, itemId: string) {
                const resp = await fetch(`${workerBackend.apiUrl}/e2e/force_unlock/${itemType}/${itemId}`, {
                    method: 'DELETE',
                });
                if (!resp.ok) {
                    throw new Error(`forceUnlockItem failed: ${resp.status} ${await resp.text()}`);
                }
            },
        };

        await use(api);
    },
});

export {expect};
