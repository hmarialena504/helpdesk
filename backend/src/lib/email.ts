import nodemailer from 'nodemailer'

// The transporter is the connection to the SMTP server
// It's created once and reused for all emails
let transporter: nodemailer.Transporter | null = null

// Get or create the email transporter
// In development with no SMTP config, uses Ethereal (fake SMTP)
// In production, uses the configured SMTP server
const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter

  if (process.env.SMTP_HOST) {
    // Production — use configured SMTP server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    console.log('📧 Email transporter configured with SMTP')
  } else {
    // Development — create a test Ethereal account automatically
    // Ethereal captures emails and shows them in a web UI
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('📧 Email transporter configured with Ethereal (development)')
    console.log(`📧 View emails at: https://ethereal.email/messages`)
    console.log(`📧 Login: ${testAccount.user} / ${testAccount.pass}`)
  }

  return transporter
}

// Base HTML template — wraps all email content with consistent styling
const emailWrapper = (content: string, title: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 32px; height: 32px; background-color: rgba(255,255,255,0.2); border-radius: 8px; text-align: center; line-height: 32px; font-weight: bold; color: white; font-size: 16px;">H</div>
                    <span style="color: white; font-weight: 600; font-size: 18px; margin-left: 10px; vertical-align: middle;">Helpdesk</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              ${content}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this email because you have an account on Helpdesk.
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Helper to create a styled button link
const emailButton = (text: string, url: string): string => `
  <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px; margin: 16px 0;">
    ${text}
  </a>
`

// Helper to create a ticket info block
const ticketInfo = (ticket: {
  id: string
  title: string
  status: string
  priority: string
}): string => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
    <tr>
      <td>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">Ticket #${ticket.id.slice(-8)}</p>
        <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">${ticket.title}</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right: 8px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: #dbeafe; color: #1d4ed8;">${ticket.status.replace('_', ' ')}</span>
            </td>
            <td>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: #fef3c7; color: #92400e;">${ticket.priority}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`

// The base URL for ticket links in emails
const getAppUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000'

// ── Email sending functions ────────────────────────────────────────────────

export const sendTicketCreatedEmail = async (params: {
  to: string
  customerName: string
  ticket: { id: string; title: string; status: string; priority: string; description: string }
}) => {
  const { to, customerName, ticket } = params
  const ticketUrl = `${getAppUrl()}/tickets/${ticket.id}`

  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
      Your ticket has been created
    </h1>
    <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
      Hi ${customerName}, we've received your support request and will get back to you as soon as possible.
    </p>
    ${ticketInfo(ticket)}
    <p style="color: #374151; font-size: 14px; margin: 16px 0 4px 0; font-weight: 500;">Description:</p>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
      ${ticket.description}
    </p>
    ${emailButton('View Ticket', ticketUrl)}
  `

  await sendEmail({
    to,
    subject: `Ticket Created: ${ticket.title}`,
    html: emailWrapper(content, 'Ticket Created'),
  })
}

export const sendTicketAssignedEmail = async (params: {
  to: string
  agentName: string
  ticket: { id: string; title: string; status: string; priority: string }
  assignedBy: string
}) => {
  const { to, agentName, ticket, assignedBy } = params
  const ticketUrl = `${getAppUrl()}/tickets/${ticket.id}`

  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
      A ticket has been assigned to you
    </h1>
    <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
      Hi ${agentName}, ${assignedBy} has assigned the following ticket to you.
    </p>
    ${ticketInfo(ticket)}
    ${emailButton('View Ticket', ticketUrl)}
  `

  await sendEmail({
    to,
    subject: `Ticket Assigned: ${ticket.title}`,
    html: emailWrapper(content, 'Ticket Assigned'),
  })
}

export const sendTicketResolvedEmail = async (params: {
  to: string
  customerName: string
  ticket: { id: string; title: string; status: string; priority: string }
}) => {
  const { to, customerName, ticket } = params
  const ticketUrl = `${getAppUrl()}/tickets/${ticket.id}`

  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
      Your ticket has been resolved
    </h1>
    <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
      Hi ${customerName}, your support ticket has been marked as resolved.
      If you're still experiencing issues, you can reopen it by replying with a comment.
    </p>
    ${ticketInfo(ticket)}
    ${emailButton('View Ticket', ticketUrl)}
  `

  await sendEmail({
    to,
    subject: `Ticket Resolved: ${ticket.title}`,
    html: emailWrapper(content, 'Ticket Resolved'),
  })
}

export const sendNewCommentEmail = async (params: {
  to: string
  recipientName: string
  authorName: string
  ticket: { id: string; title: string; status: string; priority: string }
  commentBody: string
}) => {
  const { to, recipientName, authorName, ticket, commentBody } = params
  const ticketUrl = `${getAppUrl()}/tickets/${ticket.id}`

  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
      New comment on your ticket
    </h1>
    <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
      Hi ${recipientName}, ${authorName} has added a comment to your ticket.
    </p>
    ${ticketInfo(ticket)}
    <p style="color: #374151; font-size: 14px; margin: 16px 0 4px 0; font-weight: 500;">Comment:</p>
    <div style="background-color: #f9fafb; border-left: 3px solid #2563eb; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 16px 0;">
      <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
        ${commentBody}
      </p>
    </div>
    ${emailButton('Reply to Ticket', ticketUrl)}
  `

  await sendEmail({
    to,
    subject: `New Comment: ${ticket.title}`,
    html: emailWrapper(content, 'New Comment'),
  })
}

// Core send function — all the above functions call this
const sendEmail = async (options: {
  to: string
  subject: string
  html: string
}) => {
  try {
    const transport = await getTransporter()

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'helpdesk@localhost',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    // In development, log the Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`📧 Email sent — preview: ${previewUrl}`)
    }

    return info
  } catch (err) {
    // Log the error but don't throw — email failures should never
    // crash the API or affect the HTTP response
    console.error('📧 Failed to send email:', err)
  }
}