from datetime import datetime, timedelta
import json
import sys
import threading
from flask import Flask, jsonify , request , send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_bcrypt import Bcrypt
import psycopg2
import os
from flask_cors import CORS
import websocket
ws = None
app = Flask(__name__)
bcrypt = Bcrypt(app)

api_key = os.getenv("API_KEY")
url = f"ws://158.108.97.12:8000/ws?apikey={api_key}" # This will allow all domains to access all endpoints

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'your_database')
DB_USER = os.getenv('DB_USER', 'your_username')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'your_password')
VALID_API_KEY = os.getenv("API_KEYS")

app.config['MAX_CONTENT_LENGTH'] = 1000 * 1024 * 1024 # 16 MB limit
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['HOST'] = os.getenv('IP')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)

jwt = JWTManager(app)
CORS(app)
def  connect():
    connection = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return connection

@app.route('/', methods=['GET'])
@jwt_required()
def index():
    return "first page"
    
UPLOAD_FOLDER = './fileSound'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
from werkzeug.utils import secure_filename
@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No selected files"}), 400

    uploaded_files = []
    
    for file in files:
        if file.filename == '':
            return jsonify({"error": "One or more files have no selected file name"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        if os.path.exists(file_path):
            os.remove(file_path)

        file.save(file_path)
        uploaded_files.append(filename)

    try:
        conn = connect()
        cursor = conn.cursor()
        upload_time = datetime.now()

        for filename in uploaded_files:
            cursor.execute("SELECT id FROM audio_files WHERE filename = %s", (filename,))
            existing_file = cursor.fetchone()

            if existing_file:
                cursor.execute("UPDATE audio_files SET upload_time = %s WHERE filename = %s", (upload_time, filename))
            else:
                cursor.execute("INSERT INTO audio_files (filename, upload_time) VALUES (%s, %s)", (filename, upload_time))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({"message": "Files uploaded successfully", "files": uploaded_files}), 201


app.config['UPLOAD_FOLDER_CODE'] = './fileCode'
@app.route('/uploadCode', methods=['POST'])
def uploadCode():
    try:
        uploaded_files = request.files.getlist('files') 

        if not uploaded_files:
            return jsonify({"error": "No files were uploaded"}), 400

        file_names = []

        # Process each uploaded file
        for file in uploaded_files:
            if file and file.filename:
                filename = os.path.join(app.config['UPLOAD_FOLDER_CODE'], file.filename)
                file.save(filename)
                file_names.append(file.filename)

                # Insert or update the file info in the database
                try:
                    conn = connect()
                    cursor = conn.cursor()
                    upload_time = datetime.now()

                    # Check if the file already exists in the database
                    cursor.execute("SELECT id FROM code_files WHERE filename = %s", (file.filename,))
                    existing_file = cursor.fetchone()

                    if existing_file:
                        # If file exists, update the upload time
                        cursor.execute("UPDATE code_files SET upload_time = %s WHERE filename = %s", (upload_time, file.filename))
                    else:
                        # If file does not exist, insert a new record
                        cursor.execute("INSERT INTO code_files (filename, upload_time) VALUES (%s, %s)", (file.filename, upload_time))

                    conn.commit()
                    cursor.close()
                    conn.close()

                except Exception as db_error:
                    return jsonify({"error": f"Database error: {str(db_error)}"}), 500

        return jsonify({"message": "Files uploaded successfully", "files": file_names}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@app.route('/filesTar', methods=['GET'])
def list_filesTar():
    try:
        conn = connect()
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, upload_time FROM code_files ORDER BY upload_time DESC")
        files = [
            {
                "id": row[0],
                "filename": row[1],
                "upload_time": row[2].strftime('%H:%M:%S'), 
                "upload_date": row[2].strftime('%Y-%m-%d'),
                 "file_url": f"http://{app.config['HOST']}/downloadTar/{row[1]}" ,
                 "file_del": f"http://{app.config['HOST']}/deleteTar/{row[1]}" 
            }
            for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify(files), 200
    
@app.route('/deleteTar/<tar_filename>', methods=['DELETE'])
def delete_tar(tar_filename):
    tar_path = os.path.join(app.config['UPLOAD_FOLDER_CODE'], tar_filename)
    
    try:
        if not os.path.exists(tar_path):
            return jsonify({"error": "Tar file not found"}), 404

        os.remove(tar_path)

        conn = connect()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM code_files WHERE filename = %s", (tar_filename,))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": f"{tar_filename} has been deleted successfully from both the filesystem and database."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/downloadTar/<tar_filename>', methods=['GET'])
def download_tar(tar_filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER_CODE'], tar_filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({"error": "Tar file not found"}), 404
# 2. List Audio Files
@app.route('/files', methods=['GET'])
def list_files():
    try:
        conn = connect()
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, upload_time FROM audio_files ORDER BY upload_time DESC")
        files = [
            {
                "id": row[0],
                "filename": row[1],
                "upload_time": row[2].strftime('%H:%M:%S'), 
                "upload_date": row[2].strftime('%Y-%m-%d'),
                "file_play": f"http://{app.config['HOST']}/play/{row[1]}" ,
                 "file_url": f"http://{app.config['HOST']}/download/{row[1]}" 
            }
            for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify(files), 200

@app.route('/delete/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    try:
        conn = connect()
        cursor = conn.cursor()

        cursor.execute("SELECT filename FROM audio_files WHERE id = %s", (file_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "File not found in database"}), 404
        
        filename = result[0]
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        if os.path.exists(file_path):
            os.remove(file_path) 
        else:
            return jsonify({"error": "File not found on server"}), 404
        
        cursor.execute("DELETE FROM audio_files WHERE id = %s", (file_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": f"File {filename} deleted successfully"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/play/<filename>', methods=['GET'])
def play_audio(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, mimetype='audio/mpeg')
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

# 3. Download a Specific Audio File
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('email')
    password = data.get('password')
    print(f"Received data: {data}")

    try:
        conn = connect()
        cursor = conn.cursor()

        cursor.execute("SELECT id, username, password FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user is None or user[2] != password:
            return jsonify({'message': 'Login Failed'}), 401

        access_token = create_access_token(identity=user[0], expires_delta=timedelta(hours=1))
        
        return jsonify({'message': 'Login Successful', 'access_token': access_token})

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return jsonify({'error': 'An internal error occurred'}), 500

    finally:
        if conn:
            conn.close()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['email']  
    password = data['password']

    try:
        conn = connect()
        cursor = conn.cursor()

        # Check if the user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({'message': 'User already exists'}), 400  # User already exists
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        conn.commit()

        # Generate a JWT token for the new user
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        new_user = cursor.fetchone()
        access_token = create_access_token(identity=new_user[0])

        cursor.close()
        conn.close()

        return jsonify({'message': 'Registration Successful', 'access_token': access_token}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@app.route('/get_all_data', methods=['GET'])
def get_all_data():
    try:
        conn = connect()
        cursor = conn.cursor()

        # Select all records from the sensor_machines_data table
        cursor.execute("SELECT * FROM sensor_machines_data ORDER BY record_date ASC, record_time ASC")
        records = cursor.fetchall()

        if records:
            # Map the records to a dictionary
            data = [
                {
                    'id': record[0],
                    'energy_consumption_power': record[1],
                    'voltage_l1_gnd': record[2],
                    'voltage_l2_gnd': record[3],
                    'voltage_l3_gnd': record[4],
                    'pressure': record[5],
                    'forces': record[6],
                    'cycle_count': record[7],
                    'position_of_punch': record[8],
                    'record_date': record[9],
                    'record_time': record[10].strftime('%H:%M:%S') if record[10] else None  # Convert time to string
                }
                for record in records
            ]
            return jsonify(data), 200
        else:
            return jsonify({'message': 'No records found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/sensor_data/<int:id>", methods=["PUT"])
@jwt_required()
def update_sensor_data(id):
    data = request.get_json()

    # Extracting data, making sure not to modify date and time fields
    energy_consumption_power = data.get('energy_consumption_power')
    voltage_l1_gnd = data.get('voltage_l1_gnd')
    voltage_l2_gnd = data.get('voltage_l2_gnd')
    voltage_l3_gnd = data.get('voltage_l3_gnd')
    pressure = data.get('pressure')
    forces = data.get('forces')
    cycle_count = data.get('cycle_count')
    position_of_punch = data.get('position_of_punch')

    try:
        conn = connect()
        cursor = conn.cursor()

        # Check if the record exists
        cursor.execute("SELECT * FROM sensor_machines_data WHERE id = %s", (id,))
        sensor_record = cursor.fetchone()

        if not sensor_record:
            return jsonify({"error": "Sensor data not found"}), 404

        # Updating the record
        cursor.execute("""
            UPDATE sensor_machines_data
            SET energy_consumption_power = COALESCE(%s, energy_consumption_power),
                voltage_l1_gnd = COALESCE(%s, voltage_l1_gnd),
                voltage_l2_gnd = COALESCE(%s, voltage_l2_gnd),
                voltage_l3_gnd = COALESCE(%s, voltage_l3_gnd),
                pressure = COALESCE(%s, pressure),
                forces = COALESCE(%s, forces),
                cycle_count = COALESCE(%s, cycle_count),
                position_of_punch = COALESCE(%s, position_of_punch)
            WHERE id = %s;
        """, (energy_consumption_power, voltage_l1_gnd, voltage_l2_gnd, voltage_l3_gnd, 
              pressure, forces, cycle_count, position_of_punch, id))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"msg": "Sensor data updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sensor_data/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_sensor_data(id):
    try:
        conn = connect()
        cursor = conn.cursor()

        # Check if the record exists
        cursor.execute("SELECT * FROM sensor_machines_data WHERE id = %s", (id,))
        sensor_record = cursor.fetchone()

        if not sensor_record:
            return jsonify({"error": "Sensor data not found"}), 404

        # Delete the record
        cursor.execute("DELETE FROM sensor_machines_data WHERE id = %s", (id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"msg": "Sensor data deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/data_range', methods=['POST'])
def get_data_range():
    data = request.json  # Access JSON data from the request body
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if not start_date or not end_date:
        return jsonify({"error": "Please provide both start_date and end_date in YYYY-MM-DD HH:MM:SS format"}), 400

    try:
        conn = connect()
        cursor = conn.cursor()

        # Execute SQL query to fetch data within the date-time range
        cursor.execute("""
            SELECT * FROM sensor_machines_data 
            WHERE (record_date || ' ' || record_time) >= %s 
              AND (record_date || ' ' || record_time) <= %s
            ORDER BY id DESC
        """, (start_date, end_date))

        rows = cursor.fetchall()

        # Check if data exists within the specified range
        if not rows:
            return jsonify({"message": "No data found for the specified date and time range"}), 404

        # Format the data
        data = [{
            "id": row[0],
            "energy_consumption_power": row[1],
            "voltage_l1_gnd": row[2],
            "voltage_l2_gnd": row[3],
            "voltage_l3_gnd": row[4],
            "pressure": row[5],
            "forces": row[6],
            "cycle_count": row[7],
            "position_of_punch": row[8],
            "record_date": row[9].strftime("%Y-%m-%d"),
            "record_time": row[10].strftime("%H:%M:%S")
        } for row in rows]

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/start', methods=['GET'])
def start():
    thread = threading.Thread(target=start_websocket)
    thread.start()
    return jsonify({"message": "WebSocket connection started"}), 200

# Flask route to stop WebSocket connection
@app.route('/stop', methods=['GET'])
def stop():
    global ws
    if ws:
        ws.close()
        ws = None
        return jsonify({"message": "WebSocket connection stopped"}), 200
    else:
        return jsonify({"message": "WebSocket connection is not running"}), 400

# Flask route to get the latest data from the database
@app.route('/latest', methods=['GET'])
def get_latest():
    try:
        conn = connect()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM sensor_machines_data 
            ORDER BY id DESC LIMIT 1
        """)
        latest_data = cursor.fetchone()
        if latest_data:
            result = {
                "id": latest_data[0],
                "energy_consumption_power": latest_data[1],
                "voltage_l1_gnd": latest_data[2],
                "voltage_l2_gnd": latest_data[3],
                "voltage_l3_gnd": latest_data[4],
                "pressure": latest_data[5],
                "forces": latest_data[6],
                "cycle_count": latest_data[7],
                "position_of_punch": latest_data[8],
                "record_date": latest_data[9].strftime("%Y-%m-%d"),
                "record_time": latest_data[10].strftime("%H:%M:%S")
            }
            return jsonify(result), 200
        else:
            return jsonify({"message": "No data found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    
def insert_data(data, current_date, current_time):
    try:
        conn =  connect()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_machines_data (
                energy_consumption_power, 
                voltage_l1_gnd, 
                voltage_l2_gnd, 
                voltage_l3_gnd, 
                pressure, 
                forces, 
                cycle_count, 
                position_of_punch, 
                record_date, 
                record_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
            data['Energy Consumption']['Power'],
            data['Voltage']['L1-GND'],
            data['Voltage']['L2-GND'],
            data['Voltage']['L3-GND'],
            data['Pressure'],
            data['Force'],
            data['Cycle Count'],
            data['Position of the Punch'],
            current_date,
            current_time
        ))
        conn.commit()
        print("Data inserted into the database successfully.")
    except Exception as e:
        print("Error inserting data into database:", e)
    finally:
        cursor.close()
        conn.close()

def on_message(ws, message):
    data = json.loads(message)
    current_date = datetime.now().date()
    current_time = datetime.now().strftime("%H:%M:%S")
    insert_data(data, current_date, current_time)

def on_error(ws, error):
    print("WebSocket error:", error)

def on_close(ws, close_status_code, close_msg):
    print("WebSocket connection closed")

def on_open(ws):
    print("WebSocket connection opened")
    ws.send(api_key)

def start_websocket():
    global ws
    ws = websocket.WebSocketApp(
        url,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.on_open = on_open
    ws.run_forever()

#thread = threading.Thread(target=start_websocket)
#thread.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0" ,port=5000,debug=True)