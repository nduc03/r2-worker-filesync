import { randomBytes } from 'crypto';

type MetadataRow = {
    Id: string;
    object_name: string;
    // file_type: string;
    file_path: string;
    version: number;
};

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

async function generateObjectName(db:D1Database): Promise<string> {
    let objectName = randomBytes(32).toString('hex');
    if (!objectName) {
        throw new Error('Failed to generate object name');
    }
    while (true) {
        const exists = await isObjectNameExists(db, objectName);
        if (!exists) {
            break;
        }
        objectName = randomBytes(32).toString('hex');
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

    const query = `INSERT INTO file_metadata (object_name, file_path) VALUES (?, ?)`;
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