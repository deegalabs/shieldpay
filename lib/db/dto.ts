import type { ContractorRow } from './client';

/**
 * Client-safe projections of database rows. Handlers return these instead of raw
 * rows so internal or sensitive columns never reach the browser. Add fields here
 * deliberately, not by spreading the whole row.
 */

export interface ContractorDTO {
  id: string;
  company_id: string;
  name: string;
  stellar_address: string | null;
  range_min: number;
  range_max: number;
  anchored: boolean;
  anchor_tx_hash: string | null;
  status: string;
  email: string | null;
  role: string | null;
  created_at: string;
}

/** Drops `cpf_hash` (the hash of the tax id), which the client never needs. */
export function toContractorDTO(c: ContractorRow): ContractorDTO {
  return {
    id: c.id,
    company_id: c.company_id,
    name: c.name,
    stellar_address: c.stellar_address,
    range_min: c.range_min,
    range_max: c.range_max,
    anchored: c.anchored,
    anchor_tx_hash: c.anchor_tx_hash,
    status: c.status,
    email: c.email,
    role: c.role,
    created_at: c.created_at,
  };
}

export function toContractorDTOs(list: ContractorRow[]): ContractorDTO[] {
  return list.map(toContractorDTO);
}
