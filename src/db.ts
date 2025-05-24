import { randomBytes } from 'crypto';

type MetadataRow = {
    id?: string;
    object_name: string;
    file_path: string;
    version: number;
};

function randomFilename(): string {
    return randomBytes(16).toString('hex');
}

async function isObjectNameExists(db: D1Database, objectName: string): Promise<boolean | null> {
    const query = `SELECT COUNT(*) as count FROM file_metadata WHERE object_name = ?`;
    return db.prepare(query).bind(objectName).first<{ count: number }>().then((result) => {
        return result && result.count > 0;
    });
}

async function isFilePathExists(db: D1Database, filePath: string): Promise<boolean | null> {
    const query = `SELECT COUNT(*) as count FROM file_metadata WHERE file_path = ?`;
    return db.prepare(query).bind(filePath).first<{ count: number }>().then((result) => {
        return result && result.count > 0;
    });
}

async function generateObjectName(db: D1Database): Promise<string> {
    let objectName = randomFilename();
    if (!objectName) {
        throw new Error('Failed to generate object name');
    }
    while (true) {
        const exists = await isObjectNameExists(db, objectName);
        if (!exists) {
            break;
        }
        objectName = randomFilename();
    }
    return objectName;
}

export async function getObjectName(db: D1Database, filePath: string): Promise<string | null> {
    const query = `SELECT object_name FROM file_metadata WHERE file_path = ?`;
    const result = await db.prepare(query).bind(filePath).first<MetadataRow>();
    if (result && result.object_name) {
        return result.object_name;
    }
    return null;
}

/**
 *  @returns Return Object Name
 */
export async function addObject(db: D1Database, filePath: string): Promise<string> {
    const objectName = await generateObjectName(db);

    const filePathExists = await isFilePathExists(db, filePath);
    if (filePathExists) {
        throw new Error(`File path already exists. You may want to use ${editFile.name} instead.`);
    }

    const query = `INSERT INTO file_metadata (object_name, file_path, version) VALUES (?, ?, 1)`;
    await db.prepare(query).bind(objectName, filePath).run();
    return objectName;
}

/**
 *
 * @param db
 * @param filePath
 * @returns New object name
 */
export async function editFile(db: D1Database, filePath: string): Promise<string> {
    if (!isFilePathExists(db, filePath)) {
        throw new Error(`File path not found. You may want to use ${addObject.name} instead.`);
    }

    const query = `UPDATE file_metadata SET object_name = ?, version = ? WHERE file_path = ?`;
    const objectName = await generateObjectName(db);

    const version = await db.prepare(`SELECT version FROM file_metadata WHERE file_path = ?`).bind(filePath).first<{ version: number }>();
    if (version) {
        await db.prepare(query).bind(objectName, version.version + 1, filePath).run();
    } else {
        throw new Error('Failed to get version');
    }

    return objectName;
}

/**
 *
 * @param db
 * @param filePath
 */
export async function deleteFile(db: D1Database, filePath: string): Promise<void> {
    const query = `DELETE FROM file_metadata WHERE file_path = ?`;
    await db.prepare(query).bind(filePath).run();
}

/**
 * List all files in a directory
 * @param db D1Database
 * @param directoryPath Directory path to list files from
 * @returns Array of MetadataRow
 */
export async function listFiles(db: D1Database, directoryPath: string = '/'): Promise<MetadataRow[]> {
    // todo need to test the directory path
    const query = `
    SELECT object_name, file_path, version FROM file_metadata WHERE file_path LIKE ? || '%'
    `
    if (!directoryPath.endsWith('/')) {
        directoryPath += '/';
    }
    const result = await db.prepare(query).bind(directoryPath).all<MetadataRow>();

    if (!result.success || !result.results)
        throw new Error('Cannot query this directory path.');

    return result.results;
}

/**
 * Get file metadata by file path
 * @param db D1Database
 * @param filePath File path to get metadata for
 * @returns MetadataRow or null if not found
 */
export async function getFileMetadata(db: D1Database, filePath: string): Promise<MetadataRow | null> {
    const query = `SELECT object_name, file_path, version FROM file_metadata WHERE file_path = ?`;
    return await db.prepare(query).bind(filePath).first<MetadataRow>();
}