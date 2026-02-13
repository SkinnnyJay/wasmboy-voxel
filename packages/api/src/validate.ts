import type { ZodType } from 'zod';
import { ContractRegistry, type ContractVersion } from './registry.js';

export interface ValidationResult<TPayload> {
  success: boolean;
  data: TPayload | null;
  errorMessage: string | null;
}

export function validateContractPayload<TPayload>(
  schema: ZodType<TPayload>,
  payload: unknown,
): ValidationResult<TPayload> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      data: null,
      errorMessage: result.error.message,
    };
  }

  return {
    success: true,
    data: result.data,
    errorMessage: null,
  };
}

export function validateRegistryPayload(
  version: ContractVersion,
  contractName: string,
  payload: unknown,
): ValidationResult<unknown> {
  const schema = ContractRegistry[version][contractName];
  if (!schema) {
    return {
      success: false,
      data: null,
      errorMessage: `Unknown contract schema: ${String(version)}:${String(contractName)}`,
    };
  }
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      data: null,
      errorMessage: result.error.message,
    };
  }

  return {
    success: true,
    data: result.data,
    errorMessage: null,
  };
}
