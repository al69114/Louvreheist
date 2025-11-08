#include <Arduino.h>
#include <ctype.h>

/**
 * EscrowController_SerialTest_Working.ino
 *
 * Arduino Uno acts as an escrow agent in an anonymous-auction demo.
 * Now works reliably in Serial Monitor: type one letter and press Enter.
 *
 * Commands:
 *   b - Buyer confirms purchase
 *   f - Funds deposited
 *   o - Ownership verified
 *   a - Arbiter approves (release to seller)
 *   r - Arbiter rejects (refund buyer)
 */

// ------------------------------------------------------------
// ENUMS & STRUCTS
// ------------------------------------------------------------
enum EscrowState {
  WAITING_FOR_BUYER_CONFIRMATION,
  WAITING_FOR_FUNDS,
  WAITING_FOR_OWNERSHIP_VERIFICATION,
  ARBITER_REVIEW,
  RELEASED,
  CANCELLED
};

struct Button {
  uint8_t pin;
  bool lastPressed;
};

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const uint32_t salePriceCents = 250000;               // $2,500.00 example
const unsigned long arbiterDecisionWindow = 2UL * 60UL * 1000UL;  // 2-minute window

// --- Input pins (active-low buttons) ---
Button buyerConfirmButton{2, false};
Button fundsDepositedButton{3, false};
Button ownershipVerifiedButton{4, false};
Button arbiterApproveButton{5, false};
Button arbiterRejectButton{6, false};

// --- Output pins ---
const uint8_t fundsToSellerPin = 9;
const uint8_t refundToBuyerPin = 10;
const uint8_t objectLatchPin  = 11;
const uint8_t statusLedPin    = 13;  // Onboard LED

// ------------------------------------------------------------
// GLOBALS
// ------------------------------------------------------------
EscrowState state = WAITING_FOR_BUYER_CONFIRMATION;
bool fundsHeld        = false;
bool objectReleased   = false;
uint32_t escrowBalance = 0;
unsigned long arbiterDecisionDeadline = 0;

// ------------------------------------------------------------
// FUNCTION DECLARATIONS
// ------------------------------------------------------------
void initButton(Button &button);
bool buttonPressed(Button &button);

void holdFunds();
void releaseToSeller();
void refundBuyer();
void resetEscrow(const char *reason);

void updateState(EscrowState nextState, const char *reason);
void announceState();
const char* stateName(EscrowState s);

void processCommand(char cmd);

// ------------------------------------------------------------
// SETUP
// ------------------------------------------------------------
void setup() {
  delay(2000); // let Serial connect fully
  Serial.begin(115200);
  Serial.println("=== Arduino Escrow Controller (Serial Test Mode) ===");
  Serial.println("Type: b=buyer, f=funds, o=ownership, a=approve, r=reject\n");

  initButton(buyerConfirmButton);
  initButton(fundsDepositedButton);
  initButton(ownershipVerifiedButton);
  initButton(arbiterApproveButton);
  initButton(arbiterRejectButton);

  pinMode(fundsToSellerPin, OUTPUT);
  pinMode(refundToBuyerPin, OUTPUT);
  pinMode(objectLatchPin,  OUTPUT);
  pinMode(statusLedPin,    OUTPUT);

  digitalWrite(fundsToSellerPin, LOW);
  digitalWrite(refundToBuyerPin, LOW);
  digitalWrite(objectLatchPin, HIGH);  // Locked by default
  digitalWrite(statusLedPin, LOW);

  announceState();
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------
void loop() {
  // --- Handle normal button input ---
  switch (state) {
    case WAITING_FOR_BUYER_CONFIRMATION:
      if (buttonPressed(buyerConfirmButton)) {
        updateState(WAITING_FOR_FUNDS,
                    "Buyer confirmed intent to purchase. Awaiting funds transfer.");
      }
      break;

    case WAITING_FOR_FUNDS:
      if (buttonPressed(fundsDepositedButton)) {
        holdFunds();
        updateState(WAITING_FOR_OWNERSHIP_VERIFICATION,
                    "Funds locked in escrow. Waiting for ownership verification.");
      }
      break;

    case WAITING_FOR_OWNERSHIP_VERIFICATION:
      if (buttonPressed(ownershipVerifiedButton)) {
        arbiterDecisionDeadline = millis() + arbiterDecisionWindow;
        updateState(ARBITER_REVIEW,
                    "Ownership verified. Escalating to arbiter.");
      }
      break;

    case ARBITER_REVIEW:
      if (buttonPressed(arbiterApproveButton)) {
        releaseToSeller();
        updateState(RELEASED, "Arbiter approved. Releasing funds and object.");
      } else if (buttonPressed(arbiterRejectButton)) {
        refundBuyer();
        updateState(CANCELLED, "Arbiter rejected. Refunding buyer.");
      } else if (arbiterDecisionDeadline > 0 && millis() > arbiterDecisionDeadline) {
        releaseToSeller();
        updateState(RELEASED, "Decision window expired. Auto-release executed.");
      }
      break;

    case RELEASED:
      digitalWrite(statusLedPin, HIGH);  // Solid LED = success
      break;

    case CANCELLED:
      digitalWrite(statusLedPin, millis() / 250 % 2);  // Blink = cancelled
      break;
  }

  // --- SERIAL COMMAND HANDLER ---
  if (Serial.available()) {
    char cmd = Serial.read();
    cmd = tolower(cmd);
    if (cmd == '\r' || cmd == '\n' || cmd == ' ' || cmd == '\t' || cmd == 0) return;
    Serial.print("Received command: ");
    Serial.println(cmd);
    processCommand(cmd);
  }
}

// ------------------------------------------------------------
// BUTTON UTILITIES
// ------------------------------------------------------------
void initButton(Button &button) {
  pinMode(button.pin, INPUT_PULLUP);
  button.lastPressed = false;
}

bool buttonPressed(Button &button) {
  bool pressedNow = (digitalRead(button.pin) == LOW);
  bool risingEdge = pressedNow && !button.lastPressed;
  button.lastPressed = pressedNow;
  return risingEdge;
}

// ------------------------------------------------------------
// ESCROW ACTIONS
// ------------------------------------------------------------
void holdFunds() {
  fundsHeld = true;
  escrowBalance = salePriceCents;
  objectReleased = false;
  digitalWrite(objectLatchPin, HIGH);
  const uint32_t dollars = escrowBalance / 100;
  const uint8_t cents = escrowBalance % 100;
  Serial.print("Escrow now holds $");
  Serial.print(dollars);
  Serial.print('.');
  if (cents < 10) {
    Serial.print('0');
  }
  Serial.println(cents);
}

void releaseToSeller() {
  if (!fundsHeld) {
    Serial.println("Release requested, but no funds held.");
    return;
  }
  fundsHeld = false;
  escrowBalance = 0;
  objectReleased = true;
  Serial.println("Releasing funds to seller and unlocking object.");
  digitalWrite(objectLatchPin, LOW);  // Unlock
  digitalWrite(fundsToSellerPin, HIGH);
  delay(250);
  digitalWrite(fundsToSellerPin, LOW);
}

void refundBuyer() {
  if (!fundsHeld) {
    Serial.println("Refund requested, but escrow empty.");
    return;
  }
  fundsHeld = false;
  escrowBalance = 0;
  objectReleased = false;
  Serial.println("Refunding buyer and keeping object locked.");
  digitalWrite(objectLatchPin, HIGH);
  digitalWrite(refundToBuyerPin, HIGH);
  delay(250);
  digitalWrite(refundToBuyerPin, LOW);
}

// ------------------------------------------------------------
// STATE LOGIC + SERIAL COMMAND EXECUTION
// ------------------------------------------------------------
void processCommand(char cmd) {
  switch (cmd) {
    case 'b':
      updateState(WAITING_FOR_FUNDS, "Buyer confirmed intent to purchase. Awaiting funds transfer.");
      break;
    case 'f':
      holdFunds();
      updateState(WAITING_FOR_OWNERSHIP_VERIFICATION,
                  "Funds locked in escrow. Waiting for ownership verification.");
      break;
    case 'o':
      arbiterDecisionDeadline = millis() + arbiterDecisionWindow;
      updateState(ARBITER_REVIEW,
                  "Ownership verified. Escalating to arbiter.");
      break;
    case 'a':
      releaseToSeller();
      updateState(RELEASED, "Arbiter approved. Releasing funds and object.");
      break;
    case 'r':
      refundBuyer();
      updateState(CANCELLED, "Arbiter rejected. Refunding buyer.");
      break;
    case 'x':
      resetEscrow("Escrow restarted. Waiting for buyer confirmation.");
      break;
    default:
      Serial.print("Unknown command: ");
      Serial.println(cmd);
      break;
  }
}

// ------------------------------------------------------------
// STATE MANAGEMENT
// ------------------------------------------------------------
void updateState(EscrowState nextState, const char *reason) {
  state = nextState;
  Serial.println(reason);
  announceState();
  if (state != ARBITER_REVIEW)
    arbiterDecisionDeadline = 0;
}

void announceState() {
  Serial.print("[STATE] ");
  Serial.println(stateName(state));
}

const char* stateName(EscrowState s) {
  switch (s) {
    case WAITING_FOR_BUYER_CONFIRMATION: return "Waiting for buyer confirmation";
    case WAITING_FOR_FUNDS:              return "Awaiting funds transfer";
    case WAITING_FOR_OWNERSHIP_VERIFICATION: return "Awaiting ownership verification";
    case ARBITER_REVIEW:                 return "Arbiter review in progress";
    case RELEASED:                       return "Transaction complete";
    case CANCELLED:                      return "Transaction cancelled";
    default:                             return "Unknown";
  }
}

void resetEscrow(const char *reason) {
  fundsHeld = false;
  objectReleased = false;
  escrowBalance = 0;
  arbiterDecisionDeadline = 0;
  digitalWrite(objectLatchPin, HIGH);   // lock object until new cycle
  digitalWrite(fundsToSellerPin, LOW);
  digitalWrite(refundToBuyerPin, LOW);
  digitalWrite(statusLedPin, LOW);
  updateState(WAITING_FOR_BUYER_CONFIRMATION, reason);
}
