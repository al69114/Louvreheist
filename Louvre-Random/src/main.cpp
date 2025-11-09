#include <EEPROM.h>
#include <Arduino.h>
#include <ctype.h>

#ifdef HEX
#undef HEX
#endif

#define STATUS_LED 13
#define RELEASE_PIN 9
#define MAX_AUCTIONS 5
#define AUCTION_ID_LEN 12
#define TOKEN_LEN 32 // 32 bytes (64 hex chars)

// Each entry occupies 1 + 12 + 32 + 2 = 47 bytes, padded to 48
#define ENTRY_SIZE 48

struct Entry {
  uint8_t used;                 // 0 = free, 1 = used
  char auctionId[AUCTION_ID_LEN + 1];
  uint8_t token[TOKEN_LEN];
  uint16_t crc;
};

Entry entryBuffer;

// ----------------------------------------------------
// CRC helper
// ----------------------------------------------------
uint16_t computeCRC(uint8_t *data, uint16_t len) {
  uint16_t crc = 0xFFFF;
  for (int i = 0; i < len; i++) {
    crc ^= (uint16_t)data[i] << 8;
    for (int j = 0; j < 8; j++) {
      if (crc & 0x8000)
        crc = (crc << 1) ^ 0x1021;
      else
        crc <<= 1;
    }
  }
  return crc;
}

// ----------------------------------------------------
// EEPROM helpers
// ----------------------------------------------------
int findFreeSlot() {
  for (int i = 0; i < MAX_AUCTIONS; i++) {
    int addr = i * ENTRY_SIZE;
    if (EEPROM.read(addr) != 1) return i;
  }
  return -1;
}

int findSlotByAuction(const String &id) {
  for (int i = 0; i < MAX_AUCTIONS; i++) {
    int addr = i * ENTRY_SIZE;
    EEPROM.get(addr, entryBuffer);
    if (entryBuffer.used == 1 && String(entryBuffer.auctionId) == id) return i;
  }
  return -1;
}

void eraseSlot(int i) {
  int addr = i * ENTRY_SIZE;
  for (int j = 0; j < ENTRY_SIZE; j++) EEPROM.write(addr + j, 0);
}

void clearAllSlots() {
  for (int i = 0; i < MAX_AUCTIONS; i++) eraseSlot(i);
}

// ----------------------------------------------------
// Entry I/O
// ----------------------------------------------------
void writeEntry(int slot, const String &auctionId, const uint8_t *token) {
  int addr = slot * ENTRY_SIZE;
  Entry e;
  e.used = 1;
  strncpy(e.auctionId, auctionId.c_str(), AUCTION_ID_LEN);
  for (int i = 0; i < TOKEN_LEN; i++) e.token[i] = token[i];
  e.crc = computeCRC((uint8_t *)&e, sizeof(e) - 2);
  EEPROM.put(addr, e);
}

bool readEntry(int slot) {
  int addr = slot * ENTRY_SIZE;
  EEPROM.get(addr, entryBuffer);
  uint16_t crcCheck = computeCRC((uint8_t *)&entryBuffer, sizeof(entryBuffer) - 2);
  return (crcCheck == entryBuffer.crc && entryBuffer.used == 1);
}

// ----------------------------------------------------
// Hex helpers
// ----------------------------------------------------
bool hexToBytes(const String &hex, uint8_t *out) {
  if (hex.length() < TOKEN_LEN * 2) return false;
  for (int i = 0; i < TOKEN_LEN; i++) {
    char c1 = hex[2 * i];
    char c2 = hex[2 * i + 1];
    uint8_t v1 = (c1 <= '9') ? c1 - '0' : toupper(c1) - 'A' + 10;
    uint8_t v2 = (c2 <= '9') ? c2 - '0' : toupper(c2) - 'A' + 10;
    out[i] = (v1 << 4) | v2;
  }
  return true;
}

bool tokensMatch(const uint8_t *a, const uint8_t *b) {
  for (int i = 0; i < TOKEN_LEN; i++)
    if (a[i] != b[i]) return false;
  return true;
}

void tokenToHex(const uint8_t *tokenBytes, char *out) {
  static const char HEX_DIGITS[] = "0123456789ABCDEF";
  for (int i = 0; i < TOKEN_LEN; i++) {
    out[i * 2] = HEX_DIGITS[(tokenBytes[i] >> 4) & 0x0F];
    out[i * 2 + 1] = HEX_DIGITS[tokenBytes[i] & 0x0F];
  }
  out[TOKEN_LEN * 2] = '\0';
}

// ----------------------------------------------------
// Command handlers
// ----------------------------------------------------
void handleAdd(String id, String hexToken) {
  uint8_t token[TOKEN_LEN];
  if (!hexToBytes(hexToken, token)) {
    Serial.println("ERR_FORMAT");
    return;
  }

  int existing = findSlotByAuction(id);
  if (existing >= 0) eraseSlot(existing);

  int slot = findFreeSlot();
  if (slot < 0) {
    Serial.println("ERR_FULL");
    return;
  }
  writeEntry(slot, id, token);
  Serial.print("OK_ADD:");
  Serial.println(id);
}

void handleBuy(String id, String hexToken) {
  uint8_t token[TOKEN_LEN];
  if (!hexToBytes(hexToken, token)) {
    Serial.println("ERR_FORMAT");
    return;
  }

  int slot = findSlotByAuction(id);
  if (slot < 0) {
    Serial.println("ERR_NO_ITEM");
    return;
  }

  if (!readEntry(slot)) {
    Serial.println("ERR_CORRUPT");
    return;
  }

  if (tokensMatch(entryBuffer.token, token)) {
    char purchaseHex[TOKEN_LEN * 2 + 1];
    tokenToHex(entryBuffer.token, purchaseHex);
    Serial.print("OK_RELEASE:");
    Serial.print(id);
    Serial.print(':');
    Serial.println(purchaseHex);
    digitalWrite(RELEASE_PIN, HIGH);
    delay(500);
    digitalWrite(RELEASE_PIN, LOW);
    eraseSlot(slot);
  } else {
    Serial.print("ERR_MISMATCH:");
    Serial.println(id);
    digitalWrite(STATUS_LED, HIGH);
    delay(500);
    digitalWrite(STATUS_LED, LOW);
  }
}

void handleErase(String id) {
  int slot = findSlotByAuction(id);
  if (slot < 0) {
    Serial.println("ERR_NOT_FOUND");
    return;
  }
  eraseSlot(slot);
  Serial.print("OK_ERASE:");
  Serial.println(id);
}

void handleList() {
  Serial.println("AUCTIONS:");
  for (int i = 0; i < MAX_AUCTIONS; i++) {
    int addr = i * ENTRY_SIZE;
    EEPROM.get(addr, entryBuffer);
    if (entryBuffer.used == 1) {
      Serial.print("  ");
      Serial.println(entryBuffer.auctionId);
    }
  }
}

void handleReset() {
  Serial.println("RESETTING ESCROW SYSTEM...");
  clearAllSlots();
  digitalWrite(RELEASE_PIN, LOW);
  digitalWrite(STATUS_LED, LOW);
  delay(100);
  Serial.println("EEPROM CLEARED. SYSTEM RESET COMPLETE.");
  Serial.println("=== Escrow Verification Ready ===");
}

// ----------------------------------------------------
// Setup & loop
// ----------------------------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(RELEASE_PIN, OUTPUT);
  digitalWrite(RELEASE_PIN, LOW);
  Serial.println("=== Escrow Verification Ready ===");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("ADD:")) {
      int c1 = cmd.indexOf(':', 4);
      if (c1 == -1) { Serial.println("ERR_SYNTAX"); return; }
      String id = cmd.substring(4, c1);
      String token = cmd.substring(c1 + 1);
      handleAdd(id, token);
    }
    else if (cmd.startsWith("BUY:")) {
      int c1 = cmd.indexOf(':', 4);
      if (c1 == -1) { Serial.println("ERR_SYNTAX"); return; }
      String id = cmd.substring(4, c1);
      String token = cmd.substring(c1 + 1);
      handleBuy(id, token);
    }
    else if (cmd.startsWith("ERASE:")) {
      String id = cmd.substring(6);
      handleErase(id);
    }
    else if (cmd == "LIST") {
      handleList();
    }
    else if (cmd == "RESET") {
      handleReset();
    }
    else {
      Serial.println("ERR_UNKNOWN_CMD");
    }
  }
}
