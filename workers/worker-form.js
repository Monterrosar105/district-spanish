// ============================================
// Cloudflare Worker - Form Submission Handler
// ============================================

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse JSON body
      const formData = await request.json();

      // Validate required fields
      const requiredFields = ['email', 'firstName', 'lastName', 'phone', 'level'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');

      if (missingFields.length > 0) {
        return new Response(
          JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Build email HTML
      const emailHtml = generateEmailHtml(formData);

      // Send email via Resend API
      const emailResponse = await sendEmailWithResend(env.RESEND_API_KEY, emailHtml, formData.email);

      if (!emailResponse.success) {
        console.error('Resend API error:', emailResponse.error);
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Success response
      return new Response(
        JSON.stringify({ success: true, message: 'Form submitted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};

/**
 * Generate HTML email content from form data 
 */
function generateEmailHtml(formData) {
  const scheduleList = Array.isArray(formData.schedule)
    ? formData.schedule.join(', ')
    : formData.schedule || 'Not specified';

  const referralOther = formData.referralSource === 'Other' ? formData.referralOther : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e6294; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h2 { margin: 0; }
        .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #1e6294; margin-top: 10px; }
        .value { margin-left: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>

        <div class="section">
          <div class="label">First Name:</div>
          <div class="value">${escapeHtml(formData.firstName)}</div>
        </div>

        <div class="section">
          <div class="label">Last Name:</div>
          <div class="value">${escapeHtml(formData.lastName)}</div>
        </div>

        <div class="section">
          <div class="label">Email:</div>
          <div class="value"><a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a></div>
        </div>

        <div class="section">
          <div class="label">Phone:</div>
          <div class="value">${escapeHtml(formData.phone)}</div>
        </div>

        <div class="section">
          <div class="label">Spanish Level:</div>
          <div class="value">${escapeHtml(formData.level)}</div>
        </div>

        <div class="section">
          <div class="label">Experience:</div>
          <div class="value">${formData.experience ? escapeHtml(formData.experience) : 'Not provided'}</div>
        </div>

        <div class="section">
          <div class="label">Available Schedule:</div>
          <div class="value">${scheduleList}</div>
        </div>

        ${formData.scheduleOther ? `
        <div class="section">
          <div class="label">Schedule - Other:</div>
          <div class="value">${escapeHtml(formData.scheduleOther)}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="label">Referral Source:</div>
          <div class="value">${escapeHtml(formData.referralSource)}</div>
        </div>

        ${referralOther ? `
        <div class="section">
          <div class="label">Referral - Other:</div>
          <div class="value">${escapeHtml(referralOther)}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="label">Comments:</div>
          <div class="value">${formData.comments ? escapeHtml(formData.comments) : 'None'}</div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f69521; color: #999; font-size: 12px;">
          <p>This email was sent from the District Spanish contact form.</p>
          <p>Submitted on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email using Resend API
 */
async function sendEmailWithResend(apiKey, htmlContent, senderEmail) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        /**from: 'noreply@districtspanish.com',
        to: 'team@districtspanish.com',*/

        from: 'robmonterrosa105@gmail.com',
        to: 'robmonterrosa105@gmail.com',
        subject: `New Contact Form Submission from ${senderEmail}`,
        html: htmlContent,
        reply_to: senderEmail
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Escape HTML special characters for security
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
