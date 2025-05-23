/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as db from './db';

import { handleApiRequest } from './api';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path.startsWith('/api/')) {
			return handleApiRequest(request, env.DB);
		}

		if (!path.startsWith('/file/')) return new Response('Not Found', { status: 404 });
		const filePath = path.substring('/file'.length).replace(/\/+$/, '');
		if (!filePath || filePath === '/') {
			return new Response('Filename missing', { status: 400 });
		}

		// --- File Download API ---
		if (request.method === 'GET') {
			const objectName = await db.getObjectName(env.DB, filePath);
			if (!objectName) {
				return new Response('File not found', { status: 404 });
			}

			const object = await env.MY_BUCKET.get(objectName);

			if (object === null) {
				// TODO: Mismatched DB data and R2 bucket should be handled
				return new Response('File not found', { status: 404 });
			}

			const filename = filePath.split('/').at(-1);
			if (!filename) {
				return new Response('Filename missing', { status: 400 });
			}
			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);
			headers.set('Content-Disposition', `attachment; filename="${filePath}"`); // Prompt download

			return new Response(object.body, {
				headers,
			});
		}

		// --- File Upload API ---
		if (request.method === 'POST') {
			const fileData = request.body;
			if (!fileData) {
				return new Response('No file data provided', { status: 400 });
			}
			let objectName = await db.getObjectName(env.DB, filePath);
			if (objectName) {
				env.MY_BUCKET.delete(objectName);
				objectName = await db.editFile(env.DB, filePath);
			}
			else objectName = await db.addObject(env.DB, filePath);
			if (!objectName) {
				return new Response('Failed to generate object name', { status: 500 });
			}

			try {
				await env.MY_BUCKET.put(objectName, fileData);

				return new Response(`File ${filePath} uploaded successfully.`, { status: 200 });
			} catch (e: any) {
				return new Response(`Error uploading file: ${e.message}`, { status: 500 });
			}
		}

		// TODO --- File Delete API ---
		if (request.method === 'DELETE') {
			// TODO
		}

		// TODO --- File metadata API ---
		if (request.method === 'HEAD') {
			// TODO
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
