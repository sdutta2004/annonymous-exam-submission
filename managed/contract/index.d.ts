import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  studentSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  submissionNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  answerHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  submitExam(context: __compactRuntime.CircuitContext<PS>,
             expectedExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetExam(context: __compactRuntime.CircuitContext<PS>,
            newExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  submitExam(context: __compactRuntime.CircuitContext<PS>,
             expectedExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetExam(context: __compactRuntime.CircuitContext<PS>,
            newExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submitExam(context: __compactRuntime.CircuitContext<PS>,
             expectedExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetExam(context: __compactRuntime.CircuitContext<PS>,
            newExamId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly submissionCount: bigint;
  readonly examId: Uint8Array;
  readonly lastSubmissionCommitment: Uint8Array;
  readonly activeSession: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initialExamId_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
