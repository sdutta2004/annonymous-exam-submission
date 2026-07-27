# Project Proposal: Anonymous Exam Submission (AES)

> **Zero-Knowledge Academic Integrity Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preprod-8b5cf6?style=flat-square)](https://explorer.preprod.midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-06b6d4?style=flat-square)](https://midnight.network)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Executive Summary

**Anonymous Exam Submission (AES)** is a privacy-preserving dApp engineered on the **Midnight Network** utilizing **Compact zero-knowledge (ZK) smart contracts**. AES solves a fundamental flaw in traditional educational testing: **grading bias and identity exposure**.

By enabling students to generate zero-knowledge cryptographic proofs locally on their device, candidates submit exam answers, test hashes, and secret credentials to the blockchain without exposing their personal student identity, student ID number, or demographic profile. The contract registers a verified **commitment hash** on-chain, ensuring tamper-proof submission ordering while guaranteeing absolute anonymity during grading.

---

## 🎯 Problem Statement & Solution

### The Problem
1. **Implicit Grading Bias**: Instructors and graders often subconsciously penalize or favor students based on identity, name, gender, or past academic performance.
2. **Data Leakage & Leaked Answers**: Centralized portal databases risk exposing unencrypted student answer keys and confidential submissions.
3. **Plagiarism & Retrospective Alterations**: Traditional paper or basic Web2 portals lack verifiable on-chain timestamping and cryptographic commitment integrity.

### The Midnight ZK Solution
AES utilizes Midnight’s dual-state (private witness vs. public ledger) architecture:
- **Client-Side Proof Generation**: The student's secret key (`studentSecretKey`), entropy nonce (`submissionNonce`), and raw answer hash (`answerHash`) remain strictly inside the user's browser.
- **On-Chain Public Verification**: The Midnight Compact smart contract receives a zero-knowledge proof of a `persistentHash` commitment. Graders and administrators verify that an answer was submitted on time for a specific `expectedExamId` without learning who submitted it.

---

## 🏗️ Technical Architecture & Compact Contract Design

### Smart Contract Specification (`contracts/counter.compact`)

```compact
pragma language_version 0.23;
import CompactStandardLibrary;

export ledger submissionCount: Counter;
export ledger expectedExamId: Bytes<32>;
export ledger lastSubmissionCommitment: Bytes<32>;
export ledger activeExamSession: Counter;

witness studentSecretKey(): Bytes<32>;
witness submissionNonce(): Bytes<32>;
witness answerHash(): Bytes<32>;

export circuit submitExam(targetExamId: Bytes<32>): Bytes<32> {
  assert(expectedExamId == targetExamId, "Invalid or inactive exam ID provided");

  const studentKey = studentSecretKey();
  const nonce = submissionNonce();
  const answer = answerHash();

  const submissionCommitment = persistentHash<Vector<4, Bytes<32>>>([
    pad(32, "aes:anonymous:exam:submission:v1"),
    studentKey,
    nonce,
    answer
  ]);

  submissionCount.increment(1);
  const disclosedCommitment = disclose(submissionCommitment);
  lastSubmissionCommitment = disclosedCommitment;
  return disclosedCommitment;
}

export circuit resetExam(newExamId: Bytes<32>): Bytes<32> {
  expectedExamId = disclose(newExamId);
  activeExamSession.increment(1);
  return expectedExamId;
}

export circuit incrementSession(): [] {
  activeExamSession.increment(1);
}
```

---

## 🛡️ Midnight Privacy & Verification Matrix

| Component | State Type | Visibility | Purpose |
|---|---|---|---|
| `studentSecretKey` | Private Witness | Browser Only | Student identity secret used for ZK witness computation |
| `submissionNonce` | Private Witness | Browser Only | Random salt to prevent hash dictionary attacks |
| `answerHash` | Private Witness | Browser Only | Hash of exam solutions and answers |
| `submissionCount` | Public Ledger | On-Chain Public | Total verified anonymous submissions for current exam |
| `expectedExamId` | Public Ledger | On-Chain Public | Active exam topic or session identifier set by examiner |
| `lastSubmissionCommitment` | Public Ledger | On-Chain Public | Disclosed 256-bit ZK commitment hash verifying submission validity |
| `activeExamSession` | Public Ledger | On-Chain Public | Session epoch counter incremented on exam resets |

---

## 🌐 Deployed Smart Contract & Infrastructure

- **Target Network**: Midnight Preprod Testnet
- **Unique Contract Address**: `02006f5c2ec465ebf39dc1f16f2efd4f664e7399951dcac34bb1bdc953d48668`
- **Proof Server Endpoint**: `http://localhost:6300` (Local Docker container: `midnightntwrk/proof-server:8.1.0`)
- **Indexer Endpoint**: `https://indexer.preprod.midnight.network`
- **Frontend Architecture**: Pure Vanilla TypeScript (`src/index.ts`, `src/integration/contract.ts`), HTML5, CSS3, compiled via Vite ESM modules with WebAssembly top-level await plugins.

---

## 🚀 Key Features

1. **Browser Wallet Auto-Detection**: Seamless multi-wallet detection supporting Midnight Lace Wallet (`window.midnight.mnLace`) and 1 AM Wallet (`window.oneAm`).
2. **Session Persistence**: Maintains wallet connection and address state in browser `sessionStorage` (`aes_wallet_connected`, `aes_wallet_address`).
3. **Live ZK Execution Log**: Embedded terminal emulator providing step-by-step feedback during proof generation and on-chain submission.
4. **Examiner & Admin Controls**: Interactive dashboards (`admin.html`) to configure active `expectedExamId` parameters and view global submission metrics.
5. **Chain Explorer Integration**: On-chain metadata inspector (`explorer.html`) tracking live ledger state.

---

## 🗺️ Roadmap & Level 3 Compliance Checklist

- [x] **Compact ZK Circuit**: Written in Compact `v0.23` with private witness isolation and public ledger exports.
- [x] **Vitest Unit Test Suite**: 100% test coverage passing (`4/4` tests passing).
- [x] **Unique Preprod Address**: Configured with dedicated deployment contract address `02006f5c2ec465ebf39dc1f16f2efd4f664e7399951dcac34bb1bdc953d48668` (replacing default templates).
- [x] **Vanilla TS Frontend**: Pure TypeScript logic (`src/index.ts`) managing UI bindings, proof client, and DOM interaction.
- [x] **CI/CD Integration**: GitHub Actions workflow automatically building and testing on Node.js v22.
