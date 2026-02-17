"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui";
import { fetchOne } from "@/lib/firebase/firestore";
import { cloudSubmitSatisfaction } from "@/lib/firebase/cloud-functions";
import { useParams } from "next/navigation";
import SatisfactionSurvey, { type SurveyAnswers } from "@/components/survey/satisfaction-survey";

interface SatisfactionToken {
  customerId: string;
  customerName: string;
  customerEmail: string;
  used: boolean;
  expiresAt: string;
  ratings?: Record<string, number>;
  comment?: string;
  submittedAt?: string;
}

export default function SatisfactionPage() {
  const { token } = useParams<{ token: string }>();
  const [tokenData, setTokenData] = useState<(SatisfactionToken & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadToken() {
      try {
        const data = await fetchOne<SatisfactionToken>("satisfaction-tokens", token);
        if (!data) {
          setError("This survey link is invalid or has expired.");
          return;
        }
        if (data.used) {
          setError("This survey has already been submitted. Thank you for your feedback!");
          return;
        }
        if (new Date(data.expiresAt) < new Date()) {
          setError("This survey link has expired. Please contact us for a new one.");
          return;
        }
        setTokenData(data);
      } catch {
        setError("Something went wrong loading the survey. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadToken();
  }, [token]);

  async function handleSubmit(answers: SurveyAnswers, comment: string) {
    await cloudSubmitSatisfaction({
      token,
      ratings: answers,
      comment: comment || undefined,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-10 to-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-10 to-white py-20">
        <Container size="sm">
          <div className="text-center space-y-6">
            <img src="/logo.webp" alt="CreedaVA" width={140} height={40} className="mx-auto" />
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-10 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Survey Unavailable</h1>
            <p className="text-gray-60 max-w-md mx-auto">{error}</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <SatisfactionSurvey
      customerName={tokenData?.customerName || ""}
      onSubmit={handleSubmit}
    />
  );
}
