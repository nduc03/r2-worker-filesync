import * as db from './db';

export async function handleApiRequest(request: Request, db: D1Database): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/list') {
        //TODO await db.listFiles(db);
        return new Response('List files API not implemented', { status: 501 });
    } else {
        return new Response('Not Found', { status: 404 });
    }
}