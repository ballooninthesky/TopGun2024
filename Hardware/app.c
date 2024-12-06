#include "app.h"
#include "mqtt_thr.h"  // Include the header for MQTT functions
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include "sound_thr.h"  // Include the header for sound detection functions
#include "db_helper.h"
#include "db_helper_str.h"
const char db_name[] = "/home/pi/final/mode.db";
pthread_mutex_t data_cond_mutex;
pthread_cond_t data_cond;  
int current_mode = 0; // 0 = Idle, 1 = Record, 2 = Analyze
int shared_value = 0;  
pthread_t sound_thr,alsa_thr;
int sound_thr_created = 0; // To track if sound_thr has been created


void *controller_thr_fcn(void *ptr) {
    while (1) {
        pthread_mutex_lock(&data_cond_mutex);

        if (current_mode == 0) {
            // Log mode change to Idle and stop any sound thread if running
            dbase_append_str(db_name, "Idle Mode");
            if (sound_thr_created) {
                pthread_cancel(sound_thr);  // Cancel sound_thr if it was created
                pthread_join(sound_thr, NULL);  // Wait for sound_thr to finish
                sound_thr_created = 0;
            }
        } else if (current_mode == 1) {
            // Log mode change to Record and start recording thread if not already running
            dbase_append_str(db_name, "Record Mode");
            if (pthread_create(&sound_thr, NULL, sound_thr_fcn, (void *)&shared_value) != 0) {
                fprintf(stderr, "Error creating Sound thread for recording\n");
            } else {
                sound_thr_created = 1;
            }
            pthread_cond_signal(&data_cond);
        } else if (current_mode == 2) {
            // Log mode change to Analyze and start analysis thread if not already running
            dbase_append_str(db_name, "Analyze Mode");
            if (pthread_create(&sound_thr, NULL, sound_thr_fcn, (void *)&shared_value) != 0) {
                fprintf(stderr, "Error creating Sound thread for analysis\n");
            } else {
                sound_thr_created = 1;
            }
            pthread_cond_signal(&data_cond);
        }

        pthread_mutex_unlock(&data_cond_mutex);
        sleep(1);
    }
    pthread_exit(NULL);
}

int main(int argc, char *argv[]) {
    pthread_t mqtt_thr, rest_thr, controller_thr,alsa_thr;
    dbase_init_str(db_name);
    // Initialize the mutex and condition variable
    pthread_mutex_init(&data_cond_mutex, NULL);
    pthread_cond_init(&data_cond, NULL);
    // Initialize MQTT thread and register the callback for message handling
    if (pthread_create(&controller_thr, NULL, controller_thr_fcn, NULL) != 0) {
        fprintf(stderr, "Error creating Controller thread\n");
        exit(EXIT_FAILURE);
    }

    if (pthread_create(&mqtt_thr, NULL, mqtt_thr_fcn, NULL) != 0) {
        fprintf(stderr, "Error creating MQTT thread\n");
        exit(EXIT_FAILURE);
    }

    if (pthread_create(&rest_thr, NULL, rest_thr_fcn, NULL) != 0) {
        fprintf(stderr, "Error creating REST thread\n");
        exit(EXIT_FAILURE);
    }


    // Wait for all threads to terminate
    pthread_join(mqtt_thr, NULL);
    pthread_join(rest_thr, NULL);
    pthread_join(controller_thr, NULL);

    // Clean up mutex and condition variable
    pthread_mutex_destroy(&data_cond_mutex);
    pthread_cond_destroy(&data_cond);

    return 0;
}
