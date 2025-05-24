import * as db from './db';

export async function handleApiRequest(request: Request, dbCtx: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path.startsWith('/api/list') && method === 'GET') {
        const dirPath = path.substring('/api/list'.length).replace(/\/+$/, '');
        const listFiles = await db.listFiles(dbCtx, dirPath);
        return new Response(JSON.stringify(listFiles), { status: 200 });
    }
    else if (path.startsWith('/api/file') && method === 'GET') {
        const filePath = path.substring('/api/file'.length).replace(/\/+$/, '');
        const fileMetadata = await db.getFileMetadata(dbCtx, filePath);
        if (!fileMetadata) {
            return new Response('File not found', { status: 404 });
        }
        delete fileMetadata.id; // Hide Id from the response

        return new Response(JSON.stringify(fileMetadata), { status: 200, });
    }
    else {
        return new Response('Not Found', { status: 404 });
    }
}