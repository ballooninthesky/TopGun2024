#ifndef REST_THR_H
#define REST_THR_H

#include <pthread.h>   // For pthread types
#include <curl/curl.h> // For curl functions

extern pthread_cond_t data_cond;  // Declare data_cond as extern
extern int shared_value;          // Declare shared_value as extern


// Function to send memory data to Firebase
char* request_new_api_key();  // Declare the function to request a new API key
int Send_API(const char *file_path, const char *email, const char *password);
int Download_File(const char *url, const char *access_token, const char *output_file_path);
// Function that defines the REST thread
void *rest_thr_fcn(void *ptr);

#endif // REST_THR_H
