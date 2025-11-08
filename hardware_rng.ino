#include <Arduino.h>
/*
  Hardware RNG sketch for anonymous auction backend ingestion.
  - Samples floating analog pin A0 for true entropy (leave pin disconnected).
  - Mixes successive analog readings with timer jitter via XOR and rotations.
  - Emits 32-bit random integers plus CRC32 verification every 2 seconds over Serial.
*/

const byte ANALOG_PIN = A0;
const byte SAMPLE_ROUNDS = 32;
const unsigned long OUTPUT_INTERVAL_MS = 2000UL;

uint32_t generateRandom32();
uint32_t crc32(uint32_t value);
void printHex32(uint32_t value);

void setup() {
  pinMode(ANALOG_PIN, INPUT);            // ensure no pull-ups; pin must stay floating
  Serial.begin(115200);
  Serial.println(F("Arduino Hardware RNG Initialized"));
  Serial.println(F("Format: millis | rnd=DEC | 0xHEX | crc32=0xHASH"));
}

void loop() {
  uint32_t randomValue = generateRandom32();
  uint32_t hash = crc32(randomValue);
  unsigned long now = millis();

  Serial.print(now);
  Serial.print(F(" ms | rnd="));
  Serial.print(randomValue);
  Serial.print(F(" | 0x"));
  printHex32(randomValue);
  Serial.print(F(" | crc32=0x"));
  printHex32(hash);
  Serial.println();

  delay(OUTPUT_INTERVAL_MS);
}

uint32_t generateRandom32() {
  uint32_t entropy = 0;

  for (uint8_t i = 0; i < SAMPLE_ROUNDS; ++i) {
    uint16_t sample = analogRead(ANALOG_PIN);           // capture 10-bit analog noise
    uint32_t jitter = micros();                         // micros jitter adds entropy
    uint8_t shift = (i * 7) & 0x1F;                     // pseudo-random rotation amount

    uint32_t mixed = ((uint32_t)sample << shift) ^
                     (jitter >> ((shift ^ 0x0D) & 0x1F));

    entropy ^= mixed;                                   // mix sample via XOR
    entropy = (entropy << 5) | (entropy >> 27);         // rotate left 5 bits

    delayMicroseconds(150 + (jitter & 0x3F));           // decorrelate successive reads
  }

  if (entropy == 0) {
    entropy = micros() ^ analogRead(ANALOG_PIN);        // safety net if entropy stayed 0
  }

  return entropy;
}

uint32_t crc32(uint32_t value) {
  uint32_t crc = 0xFFFFFFFFUL;

  for (uint8_t byteIndex = 0; byteIndex < 4; ++byteIndex) {
    uint8_t b = (value >> (byteIndex * 8)) & 0xFF;
    crc ^= b;
    for (uint8_t bit = 0; bit < 8; ++bit) {
      if (crc & 1) {
        crc = (crc >> 1) ^ 0xEDB88320UL;
      } else {
        crc >>= 1;
      }
    }
  }

  return ~crc;
}

void printHex32(uint32_t value) {
  for (int8_t shift = 28; shift >= 0; shift -= 4) {
    uint8_t nibble = (value >> shift) & 0x0F;
    char nibbleChar = (nibble < 10) ? ('0' + nibble) : ('A' + nibble - 10);
    Serial.print(nibbleChar);
  }
}
