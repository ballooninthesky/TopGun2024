import paho.mqtt.client as mqtt
import time
from datetime import datetime
import random

# ตั้งค่า MQTT broker
BROKER_ADDRESS = "localhost"  # เปลี่ยนเป็นที่อยู่ของ MQTT broker ของคุณ
PORT = 1883  # ปกติจะใช้พอร์ต 1883
TOPIC = "prediction_topic"

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
    else:
        print("Connection failed with code", rc)

client.on_connect = on_connect

# เริ่มการเชื่อมต่อ
client.connect(BROKER_ADDRESS, PORT, 60)

# ฟังก์ชันสำหรับส่งผลการทำนาย
def send_prediction(timestamp, prediction):
    message = f"{timestamp} {prediction}"
    client.publish(TOPIC, message)
    print("Message published:", message)

# เริ่ม loop ที่ใช้ในการส่งข้อความ
client.loop_start()

try:
    while True:
        # สร้าง timestamp และผลการทำนายแบบสุ่ม
        timestamp = datetime.now().strftime("%H:%M:%S")
        prediction = "Normal" if random.random() > 0.5 else "Faulty"
        send_prediction(timestamp, prediction)
        
        # ส่งข้อมูลทุก 10 วินาที
        time.sleep(10)
except KeyboardInterrupt:
    print("Stopped by user")
finally:
    client.loop_stop()
    client.disconnect()
