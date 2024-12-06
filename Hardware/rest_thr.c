#include "app.h"
#include <curl/curl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <cjson/cJSON.h>
#include <pthread.h>  // For thread handling

const char base_url[] = "http://192.168.1.109:5000/login";  // URL สำหรับการเข้าสู่ระบบ
const char send_url[] = "http://192.168.1.109:5000/upload";
const char load_url[] = "http://192.168.1.109:5000/download";
// Callback function for response
static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    strncat(userp, contents, realsize);
    return realsize;
}

// ฟังก์ชันเข้าสู่ระบบเพื่อรับ Access Token
char* login_and_get_token(const char *email, const char *password) {
    CURL *curl;
    CURLcode res;
    char response_buffer[1024] = {0};  // Increase buffer size for the response
    struct curl_slist *headers = NULL;

    curl = curl_easy_init();
    if (curl == NULL) {
        fprintf(stderr, "Failed to initialize cURL\n");
        return NULL;
    }

    // สร้าง JSON Payload สำหรับส่งข้อมูล email และ password
    cJSON *json_payload = cJSON_CreateObject();
    if (json_payload == NULL) {
        fprintf(stderr, "Failed to create JSON object\n");
        curl_easy_cleanup(curl);
        return NULL;
    }
    cJSON_AddStringToObject(json_payload, "email", email);
    cJSON_AddStringToObject(json_payload, "password", password);
    char *payload = cJSON_PrintUnformatted(json_payload);
    cJSON_Delete(json_payload);
    if (payload == NULL) {
        fprintf(stderr, "Failed to print JSON payload\n");
        curl_easy_cleanup(curl);
        return NULL;
    }

    // ตั้งค่า headers
    headers = curl_slist_append(headers, "Content-Type: application/json");

    // ตั้งค่า cURL สำหรับ POST request
    curl_easy_setopt(curl, CURLOPT_URL, base_url);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload);

    // ตั้งค่าการเขียนการตอบกลับลง buffer
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, response_buffer);

    // ส่งคำขอ
    res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
        fprintf(stderr, "Failed to login and get token: %s\n", curl_easy_strerror(res));
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(payload);
        return NULL;
    }

    // พิมพ์การตอบกลับของเซิร์ฟเวอร์
    printf("Server Response: %s\n", response_buffer);

    // แยก JSON การตอบกลับเพื่อดึง access_token
    cJSON *response_json = cJSON_Parse(response_buffer);
    if (response_json == NULL) {
        fprintf(stderr, "Failed to parse JSON response\n");
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(payload);
        return NULL;
    }

    // ดึง "access_token" จากการตอบกลับ
    cJSON *access_token_item = cJSON_GetObjectItemCaseSensitive(response_json, "access_token");
    if (!cJSON_IsString(access_token_item) || (access_token_item->valuestring == NULL)) {
        fprintf(stderr, "Invalid access token in response\n");
        printf("Parsed JSON: %s\n", cJSON_Print(response_json));
        cJSON_Delete(response_json);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(payload);
        return NULL;
    }

    // ตรวจสอบว่า access token ใหม่เหมือนกับของเก่าหรือไม่
    static char current_api_key[1024] = {0};  // Increase buffer size to handle larger tokens
    if (strcmp(current_api_key, access_token_item->valuestring) == 0) {
        // ถ้าเหมือนกันก็ไม่ต้องเปลี่ยนแปลงอะไร
        printf("Access token is the same as the existing one, no update needed.\n");
    } else {
        // ถ้าไม่เหมือนกันก็ทับค่าเดิมไปเลย
        strncpy(current_api_key, access_token_item->valuestring, sizeof(current_api_key) - 1);
        current_api_key[sizeof(current_api_key) - 1] = '\0';  // Ensure null termination
        // printf("Access token updated.\n");
    }

    // ทำความสะอาดหน่วยความจำ
    cJSON_Delete(response_json);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    free(payload);

    // พิมพ์ access token ที่ได้รับมา
    // printf("Access Token: %s\n", current_api_key);

    return current_api_key;  // คืนค่า access token
}

int Send_API(const char *file_path, const char *email, const char *password) {
    // ขั้นแรกทำการ login เพื่อขอ access token
    char *access_token = login_and_get_token(email, password);
    if (access_token == NULL) {
        fprintf(stderr, "Failed to obtain access token\n");
        return 1;
    }

    // ตรวจสอบค่า access token ที่ได้มา
    printf("Access Token Obtained: %s\n", access_token);

    // เมื่อได้ access token แล้ว ทำการส่งไฟล์
    CURL *curl;
    CURLcode res;
    struct curl_slist *headers = NULL;

    curl = curl_easy_init();
    if (curl == NULL) {
        fprintf(stderr, "Failed to initialize cURL\n");
        return 1;
    }

    FILE *file = fopen(file_path, "rb");
    if (file == NULL) {
        fprintf(stderr, "Failed to open file %s\n", file_path);
        curl_easy_cleanup(curl);
        return 1;
    }

    // ตั้งค่า URL สำหรับการส่งข้อมูล
    curl_easy_setopt(curl, CURLOPT_URL, send_url);

    // ตั้งค่า headers
    headers = curl_slist_append(headers, "Content-Type: multipart/form-data");
    char auth_header[1024];
    snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", access_token);
    headers = curl_slist_append(headers, auth_header);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    // ตั้งค่า form เพื่อส่งไฟล์
    curl_mime *mime;
    curl_mimepart *part;

    mime = curl_mime_init(curl);

    // Add the file to the MIME form data
    part = curl_mime_addpart(mime);
    curl_mime_filedata(part, file_path);
    curl_mime_name(part, "files");  // Name of the form field (should match 'file' in Flask)

    // Attach the MIME form to the POST request
    curl_easy_setopt(curl, CURLOPT_MIMEPOST, mime);

    // ส่งคำขอ
    res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
        fprintf(stderr, "Failed to send file: %s\n", curl_easy_strerror(res));
        curl_slist_free_all(headers);
        curl_mime_free(mime);
        curl_easy_cleanup(curl);
        fclose(file);
        return 1;
    }

    printf("File %s sent successfully\n", file_path);

    // ทำความสะอาดหน่วยความจำ
    curl_slist_free_all(headers);
    curl_mime_free(mime);
    curl_easy_cleanup(curl);
    fclose(file);

    return 0;
}
int Download_File(const char *url, const char *access_token, const char *output_file_path) {
    CURL *curl;
    CURLcode res;
    struct curl_slist *headers = NULL;
    FILE *fp = fopen(output_file_path, "wb");  // Open the output file for writing in binary mode

    if (!fp) {
        fprintf(stderr, "Failed to open file %s for writing\n", output_file_path);
        return 1;
    }

    curl = curl_easy_init();
    if (!curl) {
        fprintf(stderr, "Failed to initialize cURL\n");
        fclose(fp);
        return 1;
    }

    // Set the URL for the download
    curl_easy_setopt(curl, CURLOPT_URL, url);

    // Add the authorization header if an access token is provided
    if (access_token != NULL) {
        char auth_header[1024];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", access_token);
        headers = curl_slist_append(headers, auth_header);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    }

    // Write data to the file
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, NULL);  // Default write function, which writes to WRITEDATA

    // Perform the request
    res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
        fprintf(stderr, "Failed to download file: %s\n", curl_easy_strerror(res));
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        fclose(fp);
        return 1;
    }

    printf("File downloaded successfully to %s\n", output_file_path);

    // Clean up
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    fclose(fp);

    return 0;
}
// ฟังก์ชัน REST Thread สำหรับส่งข้อมูลการอัปเดต
void *rest_thr_fcn(void *access_token) {
    printf("Starting REST thread\n");

    while (1) {
        pthread_mutex_lock(&data_cond_mutex);
        printf("REST thread waiting for update...\n");
        pthread_cond_wait(&data_cond, &data_cond_mutex);
        int memfree_value = shared_value;
        pthread_mutex_unlock(&data_cond_mutex);
        sleep(1);
    }

    return NULL;
}