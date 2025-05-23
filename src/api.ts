import * as db from './db';

export async function handleApiRequest(request: Request, dbCtx: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/list') {
        const listFiles = await db.listFiles(dbCtx);
        return new Response(listFiles, { status: 200 });
    } else {
        return new Response('Not Found', { status: 404 });
    }
}