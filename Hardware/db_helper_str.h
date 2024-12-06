#ifndef DB_HELPER_STR_H
#define DB_HELPER_STR_H

// include files
#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>
#include <string.h>

// extern declarations for constants
extern const char INIT_SQL_CMD_STR[];
extern const char APPEND_SQL_CMD_STR[];
extern const char QUERY_SQL_CMD_STR[];

// function prototypes
void dbase_init_str(const char *db_name);
int dbase_append_str(const char *db_name, const char *value);
const char* dbase_query_str(const char *db_name);

#endif // DB_HELPER_STR_H
