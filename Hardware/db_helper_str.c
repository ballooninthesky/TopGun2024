#include "db_helper_str.h"

// renamed constants to avoid conflict
const char INIT_SQL_CMD_STR[] = "CREATE TABLE IF NOT EXISTS data_table (\
    _id INTEGER PRIMARY KEY AUTOINCREMENT, \
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, \
    value TEXT \
)";

const char APPEND_SQL_CMD_STR[] = "INSERT INTO data_table (value) VALUES (?)";

const char QUERY_SQL_CMD_STR[] = "SELECT * FROM data_table ORDER BY timestamp DESC LIMIT 1";

// Function definitions for dbase_init_str, dbase_append_str, and dbase_query_str


void dbase_init_str(const char *db_name) {
    sqlite3 *db;

    if (sqlite3_open(db_name, &db) != SQLITE_OK) {
        fprintf(stderr, "Error opening %s database\n", db_name);
        sqlite3_close(db);
        return;
    }
    if (sqlite3_exec(db, INIT_SQL_CMD_STR, NULL, NULL, NULL) != SQLITE_OK) {
        fprintf(stderr, "Error executing %s: %s\n", INIT_SQL_CMD_STR, sqlite3_errmsg(db)); 
        sqlite3_close(db);
        return;
    }
    sqlite3_close(db);
}

int dbase_append_str(const char *db_name, const char *value) {
    sqlite3 *db;
    sqlite3_stmt *stmt;

    if (sqlite3_open(db_name, &db) != SQLITE_OK) {
        fprintf(stderr, "Error opening %s database\n", db_name);
        sqlite3_close(db);
        return -1;
    }
    if (sqlite3_prepare_v2(db, APPEND_SQL_CMD_STR, -1, &stmt, NULL) != SQLITE_OK) {
        fprintf(stderr, "Error executing %s: %s\n", APPEND_SQL_CMD_STR, sqlite3_errmsg(db)); 
        sqlite3_close(db);
        return -1;
    }
    sqlite3_bind_text(stmt, 1, value, -1, SQLITE_STATIC);   
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        fprintf(stderr, "Error executing SQL\n");
    }
    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return 0;
}

const char* dbase_query_str(const char *db_name) {
    sqlite3 *db;
    sqlite3_stmt *stmt;
    const char *last_value = NULL;

    if (sqlite3_open(db_name, &db) != SQLITE_OK) {
        fprintf(stderr, "Error opening %s database\n", db_name);
        sqlite3_close(db);
        return NULL;
    }
    if (sqlite3_prepare_v2(db, QUERY_SQL_CMD_STR, -1, &stmt, NULL) != SQLITE_OK) {
        fprintf(stderr, "Error executing %s: %s\n", QUERY_SQL_CMD_STR, sqlite3_errmsg(db)); 
        sqlite3_close(db);
        return NULL;
    }
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const char *timestamp = (const char *)sqlite3_column_text(stmt, 1);
        printf("Data timestamp: %s\n", timestamp);
        last_value = (const char *)sqlite3_column_text(stmt, 2); 
        printf("Last value: %s\n", last_value);
    }
    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return last_value;
}