DROP TABLE IF EXISTS file_metadata;
CREATE TABLE file_metadata (
    id INTEGER PRIMARY KEY,
    object_name TEXT NOT NULL,
    -- file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    -- size BIGINT NOT NULL,
    version INTEGER NOT NULL,
    -- created_at TEXT
);