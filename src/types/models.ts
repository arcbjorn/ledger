export type Direction = 'debit' | 'credit';

export interface Account {
  id: string;
  name?: string;
  balance: number;
  direction: Direction;
  disabled: boolean;
}

export interface Entry {
  id: string;
  direction: Direction;
  amount: number;
  account_id: string;
}

export interface Transaction {
  id: string;
  name?: string;
  entries: Entry[];
}
