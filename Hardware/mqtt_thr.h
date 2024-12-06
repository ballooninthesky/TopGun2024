#ifndef MQTT_THR_H
#define MQTT_THR_H

#include <pthread.h>
#include <MQTTClient.h>

// Externally shared variables
extern pthread_mutex_t data_cond_mutex;
extern pthread_cond_t data_cond;
extern int shared_value;

// Function declarations
void *mqtt_thr_fcn(void *ptr);
int message_arrived(void *context, char *topicName, int topicLen, MQTTClient_message *message);

#endif // MQTT_THR_H
