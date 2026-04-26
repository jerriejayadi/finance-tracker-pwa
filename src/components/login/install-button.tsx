"use client"
import { useEffect, useState } from 'react';

export default function InstallButton() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
  };

  // Only show the button if the prompt is ready (meaning the app is installable)
  if (!deferredPrompt) return null;

  return <button onClick={handleInstallClick}>Add to Home Screen</button>;
}