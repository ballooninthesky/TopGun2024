#ifndef DB_HELPER_EVENT_H
#define DB_HELPER_EVENT_H

// include files
#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>
#include <string.h>

// extern declarations for constants
extern const char INIT_SQL_CMD_EVENT[];
extern const char APPEND_SQL_CMD_EVENT[];
extern const char QUERY_SQL_CMD_EVENT[];

// function prototypes
void dbase_init_event(const char *db_name);
int dbase_append_event(const char *db_name, const char *outcome, double confidence);
const char* dbase_query_event(const char *db_name);

#endif // DB_HELPER_EVENT_H
