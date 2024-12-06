#include "db_helper_event.h"

// คำสั่ง SQL สำหรับการสร้างตารางถ้ายังไม่มีอยู่
const char INIT_SQL_CMD_EVENT[] = 
    "CREATE TABLE IF NOT EXISTS event_log ("
    "id INTEGER PRIMARY KEY AUTOINCREMENT, "
    "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, "
    "outcome TEXT, "
    "confidence REAL);";

// คำสั่ง SQL สำหรับการเพิ่มข้อมูลในตาราง
const char APPEND_SQL_CMD_EVENT[] = 
    "INSERT INTO event_log (outcome, confidence) VALUES (?, ?);";

// คำสั่ง SQL สำหรับการสืบค้นข้อมูล
const char QUERY_SQL_CMD_EVENT[] = 
    "SELECT * FROM event_log ORDER BY timestamp DESC;";


void dbase_init_event(const char *db_name) {
    sqlite3 *db;
    char *err_msg = 0;

    int rc = sqlite3_open(db_name, &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return;
    }

    rc = sqlite3_exec(db, INIT_SQL_CMD_EVENT, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
    } else {
        //printf("Database initialized successfully.\n");
    }

    sqlite3_close(db);
}

int dbase_append_event(const char *db_name, const char *outcome, double confidence) {
    sqlite3 *db;
    sqlite3_stmt *stmt;
    int rc = sqlite3_open(db_name, &db);

    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }

    rc = sqlite3_prepare_v2(db, APPEND_SQL_CMD_EVENT, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to prepare statement: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }

    // Bind the parameters
    sqlite3_bind_text(stmt, 1, outcome, -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 2, confidence);

    // Execute the statement
    rc = sqlite3_step(stmt);
    if (rc != SQLITE_DONE) {
        fprintf(stderr, "Execution failed: %s\n", sqlite3_errmsg(db));
    } else {
        printf("Data inserted successfully.\n");
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);

    return 0;
}


const char* dbase_query_event(const char *db_name) {
    sqlite3 *db;
    sqlite3_stmt *stmt;
    static char result[1024] = {0};  // Buffer สำหรับผลลัพธ์
    int rc = sqlite3_open(db_name, &db);

    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return NULL;
    }

    rc = sqlite3_prepare_v2(db, QUERY_SQL_CMD_EVENT, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to prepare statement: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return NULL;
    }

    // Fetch the results
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        const char *timestamp = (const char *)sqlite3_column_text(stmt, 1);
        const char *outcome = (const char *)sqlite3_column_text(stmt, 2);
        double confidence = sqlite3_column_double(stmt, 3);
        
        snprintf(result, sizeof(result), "Timestamp: %s, Outcome: %s, Confidence: %f\n", 
                 timestamp, outcome, confidence);
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);

    return result;
}