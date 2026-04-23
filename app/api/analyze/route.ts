import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    icp_summary: {
      product_understood: "test",
      problem_solved: "test",
      value_promise: "test",
      likely_use_cases: ["test"],
      icp_probable: "test",
      target_functions: ["test"],
      buying_signals: ["test"],
      excluded_segments: ["test"],
    },
    results: [
      {
        lead_score: 75,
        priority: "GO",
        why_now: "test",
        probable_business_pains: "test",
        detected_opportunities: "test",
        best_outreach_channel: "Email",
        channel_reason: "test",
        email_idea: "test",
        linkedin_idea: "test",
        call_opener: "test",
        next_best_action: "test",
      },
    ],
  });
}