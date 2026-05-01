export const PAYMENT_METHODS = [
  { id: "MonCash", label: "MonCash", available: true },
  { id: "NatCash", label: "NatCash", available: false },
  { id: "Meru", label: "Meru", available: true },
  { id: "CamTransfer", label: "CAM Transfer", available: true },
  { id: "Binance", label: "Binance", available: true },
  { id: "Crypto", label: "Crypto", available: true },
  { id: "Zelle", label: "Zelle", available: false },
] as const;

export const RECEPTION_PLATFORMS = [
  "Zelle",
  "MonCash",
  "NatCash",
  "Meru",
  "Crypto",
  "Binance",
] as const;

export const EXCHANGE_RATE = 150; // 1 USD = 150 HTG for MonCash/NatCash

export const BINANCE_INFO = {
  id: "554871538",
  name: "DK27HA",
};

export const MONCASH_INFO = {
  name: "Joseph Renato",
  phone: "+50931959375",
};

export const MERU_INFO = {
  tag: "$golitecommunity",
  phone: "+50946074865",
};

export const CAM_TRANSFER_INFO = {
  name: "Dorvil Winchell",
  referenceNumber: "+50946074865",
  instructions:
    "Payez depuis un distributeur CAM et conservez la preuve de paiement.",
};

export const DEFAULT_TRC20_WALLET = "TPYgjvcLB5Jps5zEmMPgRK8xHXip5iVuyJ";

export const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  validated: {
    label: "Validé",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  paid: {
    label: "Payé",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  rejected: {
    label: "Rejeté",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};
