#include "app.h"
#include <alsa/asoundlib.h>


void *alsa_thr_fcn(void *ptr) {
    int err;
    short buf[4096];
    snd_pcm_t *capture_handle;
    snd_pcm_hw_params_t *hw_params;
    snd_pcm_sw_params_t *sw_params;

    // initialize sound
    if ((err = snd_pcm_open(&capture_handle, (char*)ptr, SND_PCM_STREAM_CAPTURE, 0)) < 0) {
        fprintf(stderr, "cannot open audio device %s (%s)\n", (char*)ptr, snd_strerror(err));
        exit(1);
    } else {
        printf("snd_pcm_open OK\n");
    }
    snd_pcm_hw_params_alloca(&hw_params);
    snd_pcm_sw_params_alloca(&sw_params);

    unsigned int rate = 48000;
    unsigned int channels = 1;
    snd_pcm_hw_params_any(capture_handle, hw_params);
    snd_pcm_hw_params_set_access(capture_handle, hw_params, SND_PCM_ACCESS_RW_INTERLEAVED);
    snd_pcm_hw_params_set_format(capture_handle, hw_params, SND_PCM_FORMAT_S16_LE);
    snd_pcm_hw_params_set_rate_near(capture_handle, hw_params, &rate, 0);
    snd_pcm_hw_params_set_channels(capture_handle, hw_params, channels);

    // Increase buffer size to reduce chances of overrun
    snd_pcm_uframes_t buffer_size = 8192; // เพิ่ม buffer size
    snd_pcm_hw_params_set_buffer_size_near(capture_handle, hw_params, &buffer_size);

    if ((err = snd_pcm_hw_params(capture_handle, hw_params)) < 0) {
        fprintf(stderr, "Error setting HW params: %s\n", snd_strerror(err));
        snd_pcm_close(capture_handle);
        exit(1);
    }
    printf("HW init OK\n");

    snd_pcm_sw_params_current(capture_handle, sw_params);
    snd_pcm_sw_params_set_start_threshold(capture_handle, sw_params, 0);
    snd_pcm_sw_params_set_avail_min(capture_handle, sw_params, 4096);  // Set minimum available frames
    if ((err = snd_pcm_sw_params(capture_handle, sw_params)) < 0) {
        fprintf(stderr, "Error setting SW params: %s\n", snd_strerror(err));
        snd_pcm_close(capture_handle);
        exit(1);
    }
    printf("SW init OK\n");

    // Start the audio stream
    if ((err = snd_pcm_prepare(capture_handle)) < 0) {
        fprintf(stderr, "unable to prepare audio stream: %s\n", snd_strerror(err));
        snd_pcm_close(capture_handle);
        exit(1);
    }

    while (1) {
        // Handle read errors, especially EPIPE (overrun)
        if ((err = snd_pcm_readi(capture_handle, buf, 4096)) != 4096) {
            if (err == -EPIPE) {
                fprintf(stderr, "Overrun occurred. Restarting...\n");
                snd_pcm_prepare(capture_handle);  // Reset ALSA if overrun occurs
            } else {
                fprintf(stderr, "read from audio interface failed (%s)\n", snd_strerror(err));
                break;
            }
        } else {
            pthread_mutex_lock(&data_cond_mutex);
            memcpy(shared_buf, buf, 4096 * sizeof(short));
            pthread_cond_signal(&data_cond);
            pthread_mutex_unlock(&data_cond_mutex);
        }
    }

    snd_pcm_close(capture_handle);
    return NULL;
}