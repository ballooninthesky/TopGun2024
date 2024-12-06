#ifndef SOUND_THR_H
#define SOUND_THR_H

// include files
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

extern int current_mode;
// shared variables
extern pthread_cond_t  data_cond;
extern pthread_mutex_t data_cond_mutex;
extern short shared_buf[];
void *sound_thr_fcn(void *ptr);
int record_audio();
int analyze_audio();
// function prototypes
void    *sound_thr_fcn(void *ptr);
#endif // SOUND_APP_H