CREATE TABLE IF NOT EXISTS file_metadata (
    id INTEGER PRIMARY KEY,
    object_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    version INTEGER NOT NULL
);
