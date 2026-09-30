export type TransferPair = { from: string; to: string };
export type TransferSide = "from" | "to";

export const EMPTY_TRANSFER: TransferPair = { from: "", to: "" };

/** Sets one side. Picking the account already on the other side swaps them, so from never equals to. */
export function setTransferSide(pair: TransferPair, side: TransferSide, id: string): TransferPair {
  const other: TransferSide = side === "from" ? "to" : "from";
  if (pair[other] === id) {
    return side === "from" ? { from: id, to: pair.from } : { from: pair.to, to: id };
  }
  return { ...pair, [side]: id };
}

export function swapTransfer(pair: TransferPair): TransferPair {
  return { from: pair.to, to: pair.from };
}

/** `preferredFrom` (or the first account) to the first other account; "" where none is available. */
export function defaultTransferPair(accountIds: string[], preferredFrom?: string): TransferPair {
  const from =
    preferredFrom && accountIds.includes(preferredFrom) ? preferredFrom : (accountIds[0] ?? "");
  const to = accountIds.find((id) => id !== from) ?? "";
  return { from, to };
}

export function isValidTransfer(pair: TransferPair, amount: number): boolean {
  return amount > 0 && !!pair.from && !!pair.to && pair.from !== pair.to;
}

/** Message key for a failed save; the DB CHECK violation gets a friendly message. */
export function saveErrorKey(err: Error): "transferSameAccount" | "saveFailed" {
  return err.message.includes("transactions_transfer_check") ? "transferSameAccount" : "saveFailed";
}
