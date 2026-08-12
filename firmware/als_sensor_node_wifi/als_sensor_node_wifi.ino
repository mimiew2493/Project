/*
  ALS Rehab Sensor Node — WiFi/HTTP variant (ESP32 / ESP8266)

  Pulls the patient's active training program straight from the web app's
  API, runs the MPU6050 + Pmod ISNS20 sensing loop against those parameters,
  and posts the result back — no PC bridge script needed.

  Flow:
    1. Poll GET /api/patient-programs?patient_id=<PATIENT_ID> until an
       ACTIVE program is found -> read repeat_count (target reps) and
       duration_sec (target duration).
    2. Run the session: count reps from MPU6050, watch current from
       Pmod ISNS20 for over-current cutoff.
    3. POST /api/sessions with { patientId, otId, usersId, durationMin, totalReps }.

  Requires the "ArduinoJson" library (Library Manager -> search "ArduinoJson"
  by Benoit Blanchon, v6.x). Board: ESP32 (WiFi.h + HTTPClient.h from the
  ESP32 core) — for ESP8266 swap WiFi.h/HTTPClient.h for ESP8266WiFi.h/
  ESP8266HTTPClient.h and add a WiFiClient to http.begin().

  Wiring — same as als_sensor_node.ino:
    MPU6050:  SDA/SCL -> board's I2C pins, AD0 -> GND (address 0x68)
    Pmod ISNS20: ISEN (pin1) -> an ADC-capable pin (ISNS_PIN), VCC 3.3V, GND

  Config below (WiFi, backend URL, patient/ot/user IDs) is per physical unit
  — set it to match whichever patient this device is currently assigned to.
*/

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------- Config: fill in per device ----------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_BASE_URL = "http://YOUR_BACKEND_HOST";  // e.g. your Vercel deployment or LAN IP:3000

const char* PATIENT_ID = "PAT000001";
const char* OT_ID = "OT000001";
const char* USERS_ID = "USR000001";  // therapist/user recording the session

// ---------- MPU6050 ----------
const uint8_t MPU_ADDR = 0x68;
int16_t ax, ay, az, gx, gy, gz;
float gyroBiasZ = 0;

// ---------- Pmod ISNS20 ----------
const int ISNS_PIN = 34;               // pick an ADC-capable pin on your board
const float ADC_VREF = 3.3;
const int ADC_RES = 4095;              // 12-bit ADC on ESP32
const float ISNS_OFFSET_V = 1.65;      // verify against datasheet for your board rev
const float ISNS_SENSITIVITY = 0.066;  // V per A — verify against datasheet
const float CURRENT_SAFETY_LIMIT_A = 15.0;

// ---------- Rep detection ----------
const float REP_THRESHOLD_G = 0.35;
const unsigned long REP_DEBOUNCE_MS = 400;
bool aboveThreshold = false;
unsigned long lastRepTime = 0;
const float LIMB_LENGTH_CM = 30.0;
float lastRepAngleAccumDeg = 0;
float totalDistanceCm = 0;

// ---------- Session state ----------
bool sessionRunning = false;
int targetReps = 0;
unsigned long targetDurationMs = 0;
unsigned long sessionStartMs = 0;
int repCount = 0;
float currentSum = 0;
float currentMax = 0;
unsigned int currentSamples = 0;
unsigned long lastGyroMs = 0;
unsigned long lastPollMs = 0;
const unsigned long POLL_INTERVAL_MS = 10000;  // check for a new program every 10s while idle

void setup() {
  Serial.begin(115200);
  Wire.begin();
  mpuInit();
  calibrateGyro();
  connectWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }

  if (!sessionRunning) {
    unsigned long now = millis();
    if (now - lastPollMs >= POLL_INTERVAL_MS) {
      lastPollMs = now;
      pollActiveProgram();
    }
  } else {
    updateMotion();
    updateCurrent();
    checkSessionEnd();
  }
}

// ---------- WiFi ----------
void connectWifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " failed, will retry");
}

// ---------- Fetch active program ----------
void pollActiveProgram() {
  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/patient-programs?patient_id=" + PATIENT_ID;
  http.begin(url);
  int code = http.GET();
  if (code != 200) {
    Serial.printf("GET patient-programs failed: %d\n", code);
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  JsonDocument doc;  // ArduinoJson v7 auto-sizing document
  DeserializationError err = deserializeJson(doc, payload);
  if (err || !doc.is<JsonArray>() || doc.size() == 0) {
    Serial.println("No program data available");
    return;
  }

  JsonObject latest = doc[0].as<JsonObject>();
  const char* status = latest["status"] | "";
  if (strcmp(status, "ACTIVE") != 0) {
    Serial.println("Latest program is not ACTIVE, waiting");
    return;
  }

  int reps = latest["repeat_count"] | 0;
  long durationSec = latest["duration_sec"] | 0;
  if (reps <= 0 || durationSec <= 0) {
    Serial.println("Program has invalid repeat_count/duration_sec");
    return;
  }

  Serial.printf("Starting session: %d reps, %ld sec\n", reps, durationSec);
  startSession(reps, durationSec);
}

// ---------- MPU6050 ----------
void mpuInit() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);
}

void calibrateGyro() {
  const int samples = 200;
  long sumGz = 0;
  for (int i = 0; i < samples; i++) {
    readMpuRaw();
    sumGz += gz;
    delay(3);
  }
  gyroBiasZ = sumGz / (float)samples;
}

void readMpuRaw() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, (uint8_t)14, (uint8_t)true);
  ax = (Wire.read() << 8) | Wire.read();
  ay = (Wire.read() << 8) | Wire.read();
  az = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read();
  gx = (Wire.read() << 8) | Wire.read();
  gy = (Wire.read() << 8) | Wire.read();
  gz = (Wire.read() << 8) | Wire.read();
}

void updateMotion() {
  readMpuRaw();

  float gx_g = ax / 16384.0;
  float gy_g = ay / 16384.0;
  float gz_g = az / 16384.0;
  float magnitude = sqrt(gx_g * gx_g + gy_g * gy_g + gz_g * gz_g);
  float swing = fabs(magnitude - 1.0);

  unsigned long now = millis();
  float dt = lastGyroMs == 0 ? 0 : (now - lastGyroMs) / 1000.0;
  lastGyroMs = now;

  float gz_dps = (gz - gyroBiasZ) / 131.0;
  if (swing > REP_THRESHOLD_G) {
    lastRepAngleAccumDeg += fabs(gz_dps) * dt;
  }

  bool nowAbove = swing > REP_THRESHOLD_G;
  if (nowAbove && !aboveThreshold && (now - lastRepTime) > REP_DEBOUNCE_MS) {
    repCount++;
    lastRepTime = now;
    float angleRad = lastRepAngleAccumDeg * PI / 180.0;
    totalDistanceCm += angleRad * LIMB_LENGTH_CM;
    lastRepAngleAccumDeg = 0;
  }
  aboveThreshold = nowAbove;
}

// ---------- Pmod ISNS20 ----------
float readCurrentAmps() {
  int raw = analogRead(ISNS_PIN);
  float volts = raw * (ADC_VREF / ADC_RES);
  return (volts - ISNS_OFFSET_V) / ISNS_SENSITIVITY;
}

void updateCurrent() {
  float amps = readCurrentAmps();
  currentSum += amps;
  currentMax = max(currentMax, fabs(amps));
  currentSamples++;

  if (fabs(amps) > CURRENT_SAFETY_LIMIT_A) {
    Serial.printf("ALERT overcurrent: %.2f A\n", amps);
    endSession();
  }
}

// ---------- Session control ----------
void startSession(int reps, unsigned long durationSec) {
  targetReps = reps;
  targetDurationMs = durationSec * 1000UL;
  sessionStartMs = millis();
  repCount = 0;
  totalDistanceCm = 0;
  lastRepAngleAccumDeg = 0;
  currentSum = 0;
  currentMax = 0;
  currentSamples = 0;
  lastGyroMs = 0;
  sessionRunning = true;
}

void checkSessionEnd() {
  unsigned long elapsed = millis() - sessionStartMs;
  if (repCount >= targetReps || elapsed >= targetDurationMs) {
    endSession();
  }
}

void endSession() {
  if (!sessionRunning) return;
  sessionRunning = false;
  unsigned long actualDurationSec = (millis() - sessionStartMs) / 1000;
  Serial.printf("Session done: %d reps, %lu sec, %.2f cm, maxCurrent %.2f A\n",
                repCount, actualDurationSec, totalDistanceCm, currentMax);
  postSessionResult(actualDurationSec);
}

// ---------- Report result to backend ----------
void postSessionResult(unsigned long actualDurationSec) {
  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/sessions";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["patientId"] = PATIENT_ID;
  doc["otId"] = OT_ID;
  doc["usersId"] = USERS_ID;
  doc["durationMin"] = actualDurationSec / 60.0;
  doc["totalReps"] = repCount;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("POST /api/sessions -> %d\n", code);
  http.end();
}
