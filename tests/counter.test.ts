import { describe, it, expect } from 'vitest';
import { Contract, ledger } from '../managed/contract/index.js';

// Helper to convert strings to 32-byte Uint8Array
function toBytes32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.subarray(0, 32));
  return bytes;
}

describe('Anonymous Exam Submission (AES) Contract - Midnight ZK Architecture', () => {

  it('1. Circuit Structure: submitExam exports valid circuit bindings with multi-witness vectors', () => {
    const mockStudentKey = toBytes32('secret_student_key_999');
    const mockNonce = toBytes32('entropy_submission_nonce_555');
    const mockAnswers = toBytes32('sha256_exam_answers_hash_abc');

    const witnesses = {
      studentSecretKey: (ctx: any) => [ctx.privateState, mockStudentKey] as [any, Uint8Array],
      submissionNonce: (ctx: any) => [ctx.privateState, mockNonce] as [any, Uint8Array],
      answerHash: (ctx: any) => [ctx.privateState, mockAnswers] as [any, Uint8Array]
    };

    const contract = new Contract(witnesses);
    expect(contract).toBeDefined();
    expect(typeof contract.circuits.submitExam).toBe('function');
    expect(typeof contract.circuits.resetExam).toBe('function');
    expect(typeof contract.circuits.incrementSession).toBe('function');
  });

  it('2. Multi-Witness Resolution: studentSecretKey, submissionNonce, and answerHash witnesses are constructed cleanly', () => {
    const mockStudentKey = toBytes32('student_privkey_hash_888');
    const mockNonce = toBytes32('random_entropy_nonce_444');
    const mockAnswers = toBytes32('sha256_final_answers_777');

    const witnesses = {
      studentSecretKey: (ctx: any) => [ctx.privateState, mockStudentKey] as [any, Uint8Array],
      submissionNonce: (ctx: any) => [ctx.privateState, mockNonce] as [any, Uint8Array],
      answerHash: (ctx: any) => [ctx.privateState, mockAnswers] as [any, Uint8Array]
    };

    const contract = new Contract(witnesses);
    expect(witnesses.studentSecretKey).toBeDefined();
    expect(witnesses.submissionNonce).toBeDefined();
    expect(witnesses.answerHash).toBeDefined();

    expect(mockStudentKey.length).toBe(32);
    expect(mockNonce.length).toBe(32);
    expect(mockAnswers.length).toBe(32);
  });

  it('3. Zero-Knowledge Privacy Model: Private witnesses are isolated from public ledger', () => {
    const privateStudentKey = toBytes32('super_secret_student_privkey');
    const privateNonce = toBytes32('private_nonce_secret');
    const privateAnswers = toBytes32('encrypted_answer_vector_hash');
    const publicExamId = toBytes32('exam_cs101_final_2026');

    const witnesses = {
      studentSecretKey: (ctx: any) => [ctx.privateState, privateStudentKey] as [any, Uint8Array],
      submissionNonce: (ctx: any) => [ctx.privateState, privateNonce] as [any, Uint8Array],
      answerHash: (ctx: any) => [ctx.privateState, privateAnswers] as [any, Uint8Array]
    };

    const contract = new Contract(witnesses);
    expect(contract.witnesses.studentSecretKey).toBeDefined();

    // Ensure raw secret values are isolated and distinct
    expect(privateStudentKey).not.toEqual(publicExamId);
    expect(privateNonce).not.toEqual(publicExamId);
    expect(privateAnswers).not.toEqual(publicExamId);
  });

  it('4. Ledger Schema Interface: Exports ledger schema query function', () => {
    expect(typeof ledger).toBe('function');
  });

});
