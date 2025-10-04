import http from 'node:http';
import { handleRequest } from '@handlers/router.ts';

const PORT = 5000;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    await handleRequest(req, res);
});

server.listen(PORT, () => {
    console.log(`=� Ledger API running on http://localhost:${PORT}`);
});
