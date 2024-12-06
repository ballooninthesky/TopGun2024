#include <stdio.h>
#include <pthread.h>
#include <alsa/asoundlib.h>
#include "sound_thr.h"
#include "rest_thr.h"
#include "db_helper.h"
#include "db_helper_event.h"
#include <limits.h>
#include <unistd.h>  // สำหรับ usleep
#include <time.h>
#include <MQTTClient.h>
#define SAMPLE_RATE 48000
#define BUFFER_SIZE 4096
#define CHANNELS 1
#define SILENCE_THRESHOLD 20  // นับการไม่มีเสียง 20 ครั้ง (ประมาณ 2 วินาที)
#define ADDRESS     "210.246.215.31:1883"  // กำหนดที่อยู่ MQTT Broker
#define CLIENTID    "AudioAnalyzerClient"
#define TOPIC       "prediction100"         // หัวข้อที่ต้องการ publish ข้อมูล
#define USER    "tgr"
#define PASS    "tgr18"
#define QOS         1
#define TIMEOUT     10000L
const char db_name1[] = "/home/pi/final/file.db";
const char db_name2[] = "/home/pi/final/event.db";
const char db_name_str2[] = "/home/pi/final/rest.db";
int file_count = 0;
// Buffer for temporarily storing audio data
short shared_buf[4096];
extern pthread_mutex_t data_cond_mutex;
extern pthread_cond_t data_cond;
extern int current_mode;
short shared_buf[BUFFER_SIZE];
int is_recording = 0;
int no_sound_counter = 0;

void write_wav_header(FILE *file, int sample_rate, int num_channels, int data_size) {
    int byte_rate = sample_rate * num_channels * sizeof(short);
    int block_align = num_channels * sizeof(short);
    
    fwrite("RIFF", 1, 4, file);
    int chunk_size = 36 + data_size;
    fwrite(&chunk_size, 4, 1, file);
    fwrite("WAVE", 1, 4, file);
    fwrite("fmt ", 1, 4, file);
    int sub_chunk_size = 16;
    fwrite(&sub_chunk_size, 4, 1, file);
    short audio_format = 1;
    fwrite(&audio_format, 2, 1, file);
    fwrite(&num_channels, 2, 1, file);
    fwrite(&sample_rate, 4, 1, file);
    fwrite(&byte_rate, 4, 1, file);
    fwrite(&block_align, 2, 1, file);
    short bits_per_sample = 16;
    fwrite(&bits_per_sample, 2, 1, file);
    fwrite("data", 1, 4, file);
    fwrite(&data_size, 4, 1, file);
}

int record_audio() {
    snd_pcm_t *capture_handle;
    snd_pcm_hw_params_t *hw_params;
    FILE *output_file = NULL;
    int total_data = 0;
    char filename[50];
    char filepath[100];
    double feature_vector[3];
    dbase_init(db_name1);
    dbase_init_str(db_name_str2);
    // Initialize ALSA for capturing
    if (snd_pcm_open(&capture_handle, "default", SND_PCM_STREAM_CAPTURE, 0) < 0) {
        perror("Cannot open audio device");
        exit(1);
    }
    
    snd_pcm_hw_params_alloca(&hw_params);
    snd_pcm_hw_params_any(capture_handle, hw_params);
    snd_pcm_hw_params_set_access(capture_handle, hw_params, SND_PCM_ACCESS_RW_INTERLEAVED);
    snd_pcm_hw_params_set_format(capture_handle, hw_params, SND_PCM_FORMAT_S16_LE);
    snd_pcm_hw_params_set_rate(capture_handle, hw_params, SAMPLE_RATE, 0);
    snd_pcm_hw_params_set_channels(capture_handle, hw_params, CHANNELS);
    snd_pcm_hw_params(capture_handle, hw_params);
    snd_pcm_prepare(capture_handle);

    printf("Start processing audio\n");

    while (1) {
        int frames = snd_pcm_readi(capture_handle, shared_buf, BUFFER_SIZE);
        if (frames < 0) {
            frames = snd_pcm_recover(capture_handle, frames, 0);
            continue;
        }

        // Normalize and detect sound
        double tmp_buf[BUFFER_SIZE];
        double freq[BUFFER_SIZE / 2];
        int sound_detected = 0;
        
        for (int i = 0; i < BUFFER_SIZE; i++) {
            tmp_buf[i] = (double)shared_buf[i] / SHRT_MAX;
        }
        // extractFeatures(SAMPLE_RATE,freq,feature_vector);
        sound_freq(tmp_buf, freq); // คำนวณความถี่จากข้อมูลเสียง
        // Debug: แสดงข้อมูลความถี่แต่ละค่า
        for (int i = 0; i < BUFFER_SIZE / 2; i++) {
            // printf("debug:%f\n",freq[i]);
            if (freq[i] < 7 && freq[i] > 1) {
                sound_detected = 1;
                break;
            }
        }

        // Start recording if sound is detected
        if (sound_detected) {
            if (!is_recording) {
                // เพิ่มการสร้างชื่อไฟล์ใหม่ทุกครั้งที่เริ่มการบันทึกใหม่
                sprintf(filename, "recorded_sound_%d.wav", file_count++);
                sprintf(filepath, "/home/pi/final/sound/%s", filename);
                printf("Sound detected. Start recording to %s...\n", filepath);
                output_file = fopen(filepath, "wb");
                if (output_file == NULL) {
                    perror("Failed to open file for recording");
                    snd_pcm_close(capture_handle);
                    return;
                }
                fseek(output_file, 44, SEEK_SET);  // reserve space for the WAV header
                is_recording = 1;
                total_data = 0;
            }
            no_sound_counter = 0;
        } else if (is_recording) {
            no_sound_counter++;
            if (no_sound_counter > SILENCE_THRESHOLD) {
                printf("Silence detected. Stopping recording...\n");
                break;
            }
        }

        // Write audio data to file if recording
        if (is_recording && output_file != NULL) {
            fwrite(shared_buf, sizeof(short), frames, output_file);
            total_data += frames * sizeof(short);
        }
        
        usleep(100000);  // รอ 100 ms
    }

    // Finish and write WAV header
    if (is_recording && output_file != NULL) {
        fseek(output_file, 0, SEEK_SET);
        write_wav_header(output_file, SAMPLE_RATE, CHANNELS, total_data);
        fclose(output_file);
        
        // ส่งไฟล์ผ่าน Send_API หลังจากบันทึกเสร็จสิ้น
        printf("Sending file %s to API...\n", filepath);
        Send_API(filepath, "rasp", "rasp");
        dbase_append(db_name1, total_data);
        dbase_append_str(db_name_str2,filepath);
        is_recording = 0; // รีเซ็ตสถานะการบันทึก
    }

    snd_pcm_close(capture_handle);
    return 0;
}


int analyze_audio() {
    MQTTClient client;
    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;
    MQTTClient_message pubmsg = MQTTClient_message_initializer;
    MQTTClient_deliveryToken token;
    int rc;
    dbase_init_event(db_name2);
    // Set MQTT broker credentials
    conn_opts.username = USER;
    conn_opts.password = PASS;

    // Initialize MQTT client
    MQTTClient_create(&client, ADDRESS, CLIENTID, MQTTCLIENT_PERSISTENCE_NONE, NULL);
    conn_opts.keepAliveInterval = 20;
    conn_opts.cleansession = 1;

    if ((rc = MQTTClient_connect(client, &conn_opts)) != MQTTCLIENT_SUCCESS) {
        printf("Failed to connect to MQTT Broker, return code %d\n", rc);
        return;
    }

    // Get the current timestamp
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char timestamp[50];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", t);

    // Prepare JSON message to publish
    char message_payload[256];
    snprintf(message_payload, sizeof(message_payload), "{\"timestamp\": \"%s\", \"result\": \"%s\"}", timestamp, "Normal");  // Replace "Normal" with actual result if needed

    // Set up the message
    pubmsg.payload = message_payload;
    pubmsg.payloadlen = (int)strlen(message_payload);
    pubmsg.qos = QOS;
    pubmsg.retained = 0;

    // Publish the message
    MQTTClient_publishMessage(client, TOPIC, &pubmsg, &token);
    printf("Publishing message to topic %s: %s\n", TOPIC, message_payload);

    // Wait for message delivery
    rc = MQTTClient_waitForCompletion(client, token, TIMEOUT);
    printf("Message delivery confirmed, token value: %d\n", token);
    dbase_append_event(db_name2, "N", 0.8);

    // Disconnect the client
    MQTTClient_disconnect(client, 10000);
    MQTTClient_destroy(&client);
    return 0;
}

void *sound_thr_fcn(void *ptr) {
    while (1) {
        pthread_mutex_lock(&data_cond_mutex);
        while (current_mode == 0) {  // Wait only if mode is Idle
            printf("Controller thread: Waiting for mode change signal...\n");
            pthread_cond_wait(&data_cond, &data_cond_mutex);
        }

        printf("Controller thread: Signal received, current_mode = %d\n", current_mode);

        if (current_mode == 1) {  // Record Mode
            printf("Controller thread: Entering Record mode...\n");
            record_audio();
        } else if (current_mode == 2) {  // Analyze Mode
            printf("Controller thread: Entering Analyze mode...\n");
            analyze_audio();
        }

        // Reset to Idle mode after handling the command
        current_mode = 0;
        pthread_mutex_unlock(&data_cond_mutex);
        pthread_cond_signal(&data_cond);  // Signal for the next mode
        sleep(1);
    }

    pthread_exit(NULL);
}
