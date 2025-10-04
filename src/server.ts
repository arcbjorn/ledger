import http from 'node:http';
import '@handlers/routes.ts';
import { handleRequest } from '@handlers/router.ts';
import { HTTP_METHOD, HTTP_STATUS, SERVER_CONFIG } from '@constants';

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', `${HTTP_METHOD.GET}, ${HTTP_METHOD.POST}, ${HTTP_METHOD.DELETE}, OPTIONS`);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(HTTP_STATUS.NO_CONTENT);
        res.end();
        return;
    }

    await handleRequest(req, res);
});

server.listen(SERVER_CONFIG.PORT, () => {
    console.log(`Ledger API running on http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
});
