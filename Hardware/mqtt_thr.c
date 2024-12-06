#include "app.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <MQTTClient.h>
#include <pthread.h>
#include <unistd.h>
#include "rest_thr.h"
#include <cjson/cJSON.h>

// #define MQTT_BROKER     "broker.emqx.io:1883"
#define MQTT_BROKER     "210.246.215.31:1883"  // Broker address
#define CLIENT_ID       "Pi"    // Unique client ID for this program
#define QOS             1                            // Quality of Service level
#define MQTT_USERNAME   "tgr"   // MQTT username
#define MQTT_PASSWORD   "tgr18"   // MQTT password

extern int current_mode;
extern pthread_mutex_t data_cond_mutex;

// Callback function for when a message arrives from the MQTT broker
int message_arrived(void *context, char *topicName, int topicLen, MQTTClient_message *message) {
    char *cmd = (char *)message->payload; 
    printf("Message arrived on topic: %s\n", topicName);
    printf("Payload: %s\n", cmd);

    // Parse the JSON message
    cJSON *json = cJSON_Parse(cmd);
    if (json == NULL) {
        printf("Error parsing JSON\n");
    } else {
        // Extract "action" and "fileName" fields from JSON
        cJSON *command = cJSON_GetObjectItemCaseSensitive(json, "action");
        cJSON *fileName = cJSON_GetObjectItemCaseSensitive(json, "fileName");

        if (cJSON_IsString(command) && (command->valuestring != NULL)) {
            pthread_mutex_lock(&data_cond_mutex);  // Lock mutex when modifying shared variable

            if (strcmp(command->valuestring, "sendFile") == 0) {
                printf("Received 'sendFile' command.\n");
                const char *email = "rasp";
                const char *password = "rasp";
            } else if (strcmp(command->valuestring, "analyzeSound") == 0) {
                printf("Received 'analyzeSound' command. Switching to Analyze mode...\n");
                current_mode = 2;
                pthread_cond_signal(&data_cond);
            } else if (strcmp(command->valuestring, "sendAudioFile") == 0 && cJSON_IsString(fileName) && (fileName->valuestring != NULL)) {
                printf("Sending audio file: %s\n", fileName->valuestring);
                const char *email = "rasp";
                const char *password = "rasp";
                char file_path[256];
                current_mode = 0;
                snprintf(file_path, sizeof(file_path), "/home/pi/final/sound/%s", fileName->valuestring);

                // Call Send_API to send the file
                if (Send_API(file_path, email, password) == 0) {
                    printf("File sent successfully\n");
                } else {
                    printf("Failed to send file\n");
                }
            } else if (strcmp(command->valuestring, "record") == 0) {
                printf("Switching to Record mode...\n");
                current_mode = 1;
                pthread_cond_signal(&data_cond);
            } else if (strcmp(command->valuestring, "stopWorking") == 0) {
                printf("Switching to Idle mode...\n");
                current_mode = 0;
                pthread_cond_signal(&data_cond);
            } else {
                printf("Received unknown command: %s\n", command->valuestring);
            }

            pthread_mutex_unlock(&data_cond_mutex);  // Unlock mutex after modification
        } else {
            printf("Invalid command or missing 'action' field in JSON\n");
        }

        cJSON_Delete(json);  // Free JSON object only if it was successfully parsed
    }

    MQTTClient_freeMessage(&message);
    MQTTClient_free(topicName);
    return 1;
}

// MQTT thread function to initialize the client, connect to the broker, and subscribe to topics
void *mqtt_thr_fcn(void *ptr) {
    int rc;
    printf("Starting MQTT thread\n");

    MQTTClient mqtt_client;
    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;
    MQTTClient_create(&mqtt_client, MQTT_BROKER, CLIENT_ID, MQTTCLIENT_PERSISTENCE_NONE, NULL);

    MQTTClient_setCallbacks(mqtt_client, NULL, NULL, message_arrived, NULL);

    conn_opts.keepAliveInterval = 20;
    conn_opts.cleansession = 1;
    conn_opts.username = MQTT_USERNAME;
    conn_opts.password = MQTT_PASSWORD;

    printf("Attempting to connect to broker at %s...\n", MQTT_BROKER);
    if ((rc = MQTTClient_connect(mqtt_client, &conn_opts)) != MQTTCLIENT_SUCCESS) {
        printf("Failed to connect, return code %d\n", rc);
        MQTTClient_destroy(&mqtt_client);
        pthread_exit(NULL);
    }
    printf("Connected to MQTT broker\n");

    const char *topics[] = {"raspberryPi/sendFile", "raspberryPi/analyzeSound", "raspberryPi/sendAudioFile", "raspberryPi/stopWorking", "raspberryPi/record"};
    for (int i = 0; i < 5; i++) {
        if ((rc = MQTTClient_subscribe(mqtt_client, topics[i], QOS)) != MQTTCLIENT_SUCCESS) {
            printf("Failed to subscribe to topic %s, return code %d\n", topics[i], rc);
            MQTTClient_disconnect(mqtt_client, 10000);
            MQTTClient_destroy(&mqtt_client);
            pthread_exit(NULL);
        }
        printf("Subscribed to topic %s\n", topics[i]);
    }

    printf("Listening for messages...\n");
    while (1) {
        MQTTClient_yield();
        usleep(100000);
    }

    MQTTClient_disconnect(mqtt_client, 10000);
    MQTTClient_destroy(&mqtt_client);
    return NULL;
}
