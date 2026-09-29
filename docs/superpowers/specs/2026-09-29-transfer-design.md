# Transfer Between Accounts Design Spec

**Date:** 2026-09-29
**Scope:** Move balance between the user's own accounts as a single "Transfer" transaction.

---

## 0. Intent

- A Transfer moves money from one of the user's accounts to another. It is neither income nor expense.
- Form fields: **Date, From account, To account, Amount, Note**. No category, no merchant.
- From balance decreases by `amount`, To balance increases by `amount`.
- Transfers never count toward income/expense totals, budgets, or dashboard day totals.
- Transfers are editable and deletable like any other transaction.

**Out of scope:** CSV/Excel import of transfers (stays `transferUnsupported`), transfer fees, cross-currency transfers, insufficient-balance checks (balances may go negative — credit-card accounts exist).

**Decision record:** single-table model (`transactions.to_account_id`) chosen over a separate `transfers` table. Reason: the UI already treats Transfer as a transaction type (drawer tab, edit-drawer type switch, unified history list with date ordering, `limit`, search, bulk delete). A separate table would require a UNION view for history, cross-table moves when switching type, and split bulk deletes. Revisit if transfers gain their own attributes (fees, FX rate, scheduling).

---

## 1. Data Layer

### Migration — `supabase/migrations/20260929100000_add_transfer_to_account.sql`

1. Add column:
   ```sql
   ALTER TABLE transactions
     ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
   CREATE INDEX IF NOT EXISTS transactions_to_account_idx ON transactions (to_account_id);
   ```
   `ON DELETE CASCADE` matches the existing `account_id` FK behavior.
2. Legacy cleanup (before the constraint): any existing `type = 'Transfer'` row with `to_account_id IS NULL` is converted to `type = 'Expense'` (preserves data rather than deleting).
3. Constraint:
   ```sql
   ALTER TABLE transactions ADD CONSTRAINT transactions_transfer_check CHECK (
     (type = 'Transfer' AND to_account_id IS NOT NULL AND to_account_id <> account_id)
     OR (type <> 'Transfer' AND to_account_id IS NULL)
   );
   ```
4. Recreate `account_balances` view (same columns as today):
   - Join: `LEFT JOIN transactions t ON t.account_id = a.id OR t.to_account_id = a.id`
   - Balance expression:
     - `Income` → `+amount`
     - `Expense` → `-amount`
     - `Transfer` and `t.account_id = a.id` → `-amount`
     - `Transfer` and `t.to_account_id = a.id` → `+amount`
   - Keep `security_invoker = true`.

5. RLS: FK checks bypass RLS, so a user could reference another user's account uuid. Replace the transactions policy's `WITH CHECK` with:
   ```sql
   auth.uid() = user_id
   AND EXISTS (SELECT 1 FROM accounts WHERE id = account_id AND user_id = auth.uid())
   AND (to_account_id IS NULL
        OR EXISTS (SELECT 1 FROM accounts WHERE id = to_account_id AND user_id = auth.uid()))
   ```
   `USING` clause unchanged.

### Transfer row shape

| column | value |
|---|---|
| `type` | `'Transfer'` |
| `account_id` | From account |
| `to_account_id` | To account |
| `category` | `'Transfer'` (column is NOT NULL) |
| `category_id` | `null` |
| `merchant` | `null` |
| `amount`, `currency`, `date`, `note` | as entered |

### Service — `src/services/transactions/transactions.service.ts`

- `Transaction`: add `to_account_id: string | null` and joined `to_account_name?: string`.
- `CreateTransactionPayload` / `UpdateTransactionPayload`: add `to_account_id?: string | null`.
- `getTransactions` select — explicit FK hints (a second FK to `accounts` makes the current `accounts!inner(name)` ambiguous):
  ```
  *,
  accounts!transactions_account_id_fkey!inner(name),
  to_account:accounts!transactions_to_account_id_fkey(name),
  categories(name, icon)
  ```
  Flatten `to_account.name` → `to_account_name`. Verify actual FK constraint names after migration.
- `TransactionFilters.type`: extend to `"income" | "expense" | "transfer"`.
- Account filter: `or(account_id.in.(ids),to_account_id.in.(ids))` so a transfer appears under either side.
- `updateTransaction` for a non-Transfer type must send `to_account_id: null`.
- Summaries (`getTransactionSummary`, `getYearlySummary`) and budgets (`.eq("type", "Expense")`) already ignore transfers — no change.
- Invalidation: transfer create/update/delete must invalidate account balance queries (verify existing hooks already do for all transaction mutations).

`src/components/history/history-constants.ts` type: add `to_account_id` / `to_account_name`.

---

## 2. UI

### Add drawer — `src/components/transactions/add-transaction-drawer.tsx`

When `type === "transfer"`:
- Hide category quick grid and category picker view.
- Replace the single Account row with **From** and **To** rows. Both open the existing `AccountPickerView`; new state `pickerTarget: "from" | "to"` decides which value is set.
- **Swap button** between From and To: round icon button (`ArrowUpDown` from lucide), right-aligned on the divider between the two rows. Tap swaps both ids and labels; 180° rotate transition; `navigator.vibrate?.(10)` (matches `use-long-press`). Disabled while To is empty.
- Defaults: From = first active account, To = second active account.
- Picking the same account as the other side swaps the two values instead of producing From = To.
- Note input writes only `note` (not `merchant`).
- Save disabled while `amount <= 0` or From/To missing or equal.
- Fewer than 2 active accounts: Transfer tab body shows a hint ("Need at least 2 accounts to transfer") instead of the form; Save hidden/disabled.
- Save payload: shape from §1; `category: "Transfer"`, no `category_id`.
- Reset-on-open logic also clears To.

### Edit drawer — `src/components/transactions/edit-transaction-drawer.tsx`

- Same From / To / swap UI when type is transfer; initialized from `account_id` / `to_account_id`.
- Type switch Expense/Income → Transfer: current account becomes From; To defaults to first other active account.
- Type switch Transfer → Expense/Income: From becomes the account; `to_account_id` sent as `null`; category must be picked (existing default-category effect applies).

### Display (neutral style)

- **History list** (`history-list.tsx`) and **dashboard recent list** (`(main)/page.tsx` → `transaction-item.tsx`): ⇄ icon (`ArrowLeftRight`) instead of category emoji; title "Transfer"; subtitle `From → To`; amount in `text-fg-0`, no +/− sign.
- **Detail drawer** (`tx-detail-drawer.tsx`): From and To rows replace Account and Category; neutral amount.
- **Delete drawer** (`delete-transactions-drawer.tsx`): same neutral single-item rendering.
- **Dashboard day total** (`(main)/page.tsx:164`): exclude transfers (currently counted as negative).
- **Dashboard category chips**: exclude transfers from category counts (they have no real category).
- **History summary** (`history-summary.tsx`): already filters Income/Expense — no change.
- **History filter drawer** (`history-filter-drawer.tsx`): add "Transfer" type option; `history/page.tsx` active-filter label handles it.

### i18n — `src/messages/en.json`, `src/messages/id.json`

New keys (namespace `transaction` unless noted): `from`, `to`, `swapAccounts` (aria-label), `transferNeedsTwoAccounts`, `transferSameAccount`. Reuse existing `common.transfer`.

---

## 3. Error Handling

- Client prevents From = To and zero amount; DB CHECK is the backstop. Supabase error message surfaces via the existing mutation error path.
- Deleting an account cascades its transfers on both sides (consistent with current behavior for regular transactions).

---

## 4. Verification

No test runner is configured.
- `npm run lint` and `npm run build` pass.
- Migration applies cleanly on local Supabase (`supabase db reset` or `migration up`).
- Manual in running app:
  1. Create transfer A → B for X: A balance −X, B balance +X; dashboard income/expense totals unchanged; budget spent unchanged.
  2. Swap button flips From/To; picking same account on both sides swaps instead.
  3. Edit transfer amount / swap direction: balances recompute correctly.
  4. Edit transfer → Expense: `to_account_id` null, B balance restored.
  5. Delete transfer (single + bulk mixed selection): balances restored.
  6. History filter by account B shows the transfer; Transfer type filter works.
  7. With one active account, Transfer tab shows the hint.
