/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
    // A simple listener to let us know when the browser drops offline
    window.addEventListener('offline', () => setIsOffline(true));
    window.addEventListener('online', () => setIsOffline(false));
  }, []);

  const addTransaction = async () => {
    await fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ desc: 'Coffee', amount: -5 }),
    });
    fetchTransactions(); // Refresh the list
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>💸 Finance Tracker</h1>
      {isOffline && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ You are currently offline.</p>}
      
      <button onClick={fetchTransactions} style={{ marginRight: '1rem', padding: '0.5rem' }}>
        Refresh Data
      </button>
      <button onClick={addTransaction} style={{ padding: '0.5rem' }}>
        Add $5 Coffee
      </button>

      <ul>
        {transactions.map((t) => (
          <li key={t.id}>
            {t.desc}: ${t.amount}
          </li>
        ))}
      </ul>
    </main>
  );
}