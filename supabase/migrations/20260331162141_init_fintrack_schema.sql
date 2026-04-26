-- 1. Profiles Table (Links securely to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  phone text,
  currency_preference varchar(3) default 'IDR' check (currency_preference ~ '^[A-Z]{3}$')
);

-- 2. Accounts Table (The "Money Pools" like BCA, Blu, Cash)
create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null
);

-- 3. Budgets Table (The Planned amounts)
create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  month_year text not null, -- e.g., '2026-04'
  category text not null,
  planned_amount numeric not null default 0
);

-- 4. Transactions Table (The actual log)
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  type text not null, -- 'Income', 'Expense', or 'Transfer'
  category text not null,
  amount numeric not null default 0,
  date date not null,
  note text
);

-- Create a Virtual Table that automatically calculates balances
create or replace view account_balances with (security_invoker = true) as
select 
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  coalesce(sum(
    case 
      when t.type = 'Income' then t.amount
      when t.type = 'Expense' then -t.amount
      else 0 
    end
  ), 0) as balance
from accounts a
left join transactions t on a.id = t.account_id
group by a.id, a.user_id, a.name, a.type;

-- 1. TURN ON THE LOCKS
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table budgets enable row level security;
alter table transactions enable row level security;

-- 2. CREATE THE RULES (Policies)
-- Profiles: Users can only select and update their OWN profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Accounts: Users can CRUD their own accounts
create policy "Users manage own accounts" on accounts for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

-- Budgets: Users can CRUD their own budgets
create policy "Users manage own budgets" on budgets for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

-- Transactions: Users can CRUD their own transactions
create policy "Users manage own transactions" on transactions for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);