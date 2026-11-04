# Website enquiry email setup

The website sends contact, quotation, site-visit and fault-report forms to the Samarth Fire inbox through the Vercel serverless endpoint at `/api/lead`.

## Required Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for Production and Preview:

- `RESEND_API_KEY`: a private API key created in the Resend dashboard. Never put this value in GitHub or frontend code.
- `EMAIL_FROM`: a sender address on a domain verified in Resend, for example `Samarth Fire Website <website@samarthfire.in>` after that exact sending domain/address is verified.
- `LEADS_TO` (optional): comma-separated inboxes. If omitted, messages go to `samarthfireprotectionsystem@gmail.com`.

After adding or changing variables, redeploy the Vercel project so the functions receive them.

## Resend setup

1. Create a Resend account and add the sending domain you control.
2. Add the DNS records Resend provides at your domain registrar/DNS host.
3. Wait until Resend shows the domain as verified.
4. Create an API key with permission to send email.
5. Add the API key and sender address to Vercel Environment Variables.

Do not use the Resend test sender for real customer enquiries. The sender domain needs to be verified before going live.

## Form behaviour

- Contact, quotation, fire-safety site visit and fault-report forms POST to `/api/lead`.
- The success message appears only after the email provider accepts the message.
- If email is not configured or sending fails, the visitor sees an error and a WhatsApp fallback.
- Optional audit drawings/photos can be attached as PDF, JPG or PNG up to 1.5 MB.

The API sends the email to the business inbox. It does not send a quote or audit report back to the customer; those documents still need to be prepared and sent by the Samarth team.
