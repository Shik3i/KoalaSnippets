"use client";

import { useEffect, useState } from "react";

interface ProtectedEmailProps {
  encodedEmail: string;
}

export function ProtectedEmail({ encodedEmail }: ProtectedEmailProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    if (encodedEmail) {
      try {
        const decoded = atob(encodedEmail);
        if (decoded) {
          setTimeout(() => setEmail(decoded), 0);
        }
      } catch {
        setTimeout(() => setEmail(""), 0);
      }
    }
  }, [encodedEmail]);

  if (!mounted) {
    return <span className="text-muted-foreground">[E-Mail wird geladen...]</span>;
  }

  if (!email) {
    return <span className="text-muted-foreground">Keine E-Mail hinterlegt</span>;
  }

  return (
    <a
      href={`mailto:${email}`}
      className="text-primary hover:underline"
    >
      {email}
    </a>
  );
}
