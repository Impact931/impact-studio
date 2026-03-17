// ---------------------------------------------------------------------------
// AI Readiness Assessment — Email Notification
// ---------------------------------------------------------------------------

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AssessmentResult } from '@/types/assessment';

const REGION = process.env.AWS_REGION || 'us-east-1';
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@jhr-photography.com';

const sesConfig: ConstructorParameters<typeof SESClient>[0] = {
  region: REGION,
};

if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  sesConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}

const ses = new SESClient(sesConfig);

// ---------------------------------------------------------------------------
// Notification to Jayson when someone completes the assessment
// ---------------------------------------------------------------------------

export async function sendAssessmentNotification(result: AssessmentResult) {
  const { formData, score, tier, signals, reportUrl } = result;

  const signalsList = signals.length
    ? signals
        .map(
          (s) =>
            `<tr>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:bold;">${s.label}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;">${s.opportunity}</td>
            </tr>`,
        )
        .join('\n')
    : '<tr><td colspan="2" style="padding:8px;color:#999;">No strong signals detected</td></tr>';

  const tierColor =
    tier === 'AI Curious'
      ? '#DC2626'
      : tier === 'AI Ready'
        ? '#D97706'
        : '#059669';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;">
  <h2 style="color:#1a1a1a;">New AI Readiness Assessment</h2>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:4px 0;font-weight:bold;width:160px;">Company</td><td>${formData.company}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Contact</td><td>${formData.contactName}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Email</td><td><a href="mailto:${formData.email}">${formData.email}</a></td></tr>
    ${formData.phone ? `<tr><td style="padding:4px 0;font-weight:bold;">Phone</td><td>${formData.phone}</td></tr>` : ''}
    <tr><td style="padding:4px 0;font-weight:bold;">Organization</td><td>${formData.organizationType === 'Other' ? formData.organizationTypeOther || 'Other' : formData.organizationType}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Team Size</td><td>${formData.teamSize}</td></tr>
  </table>

  <div style="background:#f8f8f8;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
    <div style="font-size:48px;font-weight:bold;color:${tierColor};">${score}</div>
    <div style="font-size:14px;color:#666;margin-top:4px;">AI Readiness Score</div>
    <div style="display:inline-block;margin-top:8px;padding:4px 16px;border-radius:20px;background:${tierColor};color:white;font-weight:bold;font-size:14px;">${tier}</div>
  </div>

  <h3>Review Interest</h3>
  <p style="font-size:16px;font-weight:bold;color:${formData.interestedInReview === 'Yes - let\'s schedule it' ? '#059669' : '#D97706'};">
    ${formData.interestedInReview}
  </p>

  <h3>Consulting Signals</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${signalsList}
  </table>

  ${formData.magicWandAnswer ? `
  <h3>Magic Wand Answer</h3>
  <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #C8A96E;background:#faf8f5;font-style:italic;">
    "${formData.magicWandAnswer}"
  </blockquote>
  ` : ''}

  ${formData.discoveryNote1 ? `
  <h3>Discovery Note — Tool Frustrations</h3>
  <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #C8A96E;background:#faf8f5;font-style:italic;">
    "${formData.discoveryNote1}"
  </blockquote>
  ` : ''}

  ${formData.discoveryNote2 ? `
  <h3>Discovery Note — Information Bottleneck</h3>
  <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #C8A96E;background:#faf8f5;font-style:italic;">
    "${formData.discoveryNote2}"
  </blockquote>
  ` : ''}

  <div style="margin-top:24px;">
    <a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#C8A96E;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">View Full Report</a>
  </div>

  <p style="margin-top:24px;font-size:12px;color:#999;">
    Submitted: ${new Date(result.submittedAt).toLocaleString('en-US', { timeZone: 'America/Chicago' })}
  </p>
</body>
</html>`;

  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      ReplyToAddresses: [formData.email],
      Destination: { ToAddresses: ['jayson@jhr-photography.com'] },
      Message: {
        Subject: {
          Data: `[AI Assessment] ${formData.company} — Score: ${score}/100 (${tier})`,
        },
        Body: { Html: { Data: html } },
      },
    }),
  );
}
