import { NextResponse } from "next/server";

// We'll use a variable outside the handler so it acts as an in-memory database
// while the server is running. This lets us "change" data.
const transactions = [
  { id: 1, desc: "Groceries", amount: -50 },
  { id: 2, desc: "Salary", amount: 2000 },
];

export async function GET() {
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const newTransaction = await request.json();
  transactions.push({ ...newTransaction, id: Date.now() });
  return NextResponse.json({ success: true });
}
