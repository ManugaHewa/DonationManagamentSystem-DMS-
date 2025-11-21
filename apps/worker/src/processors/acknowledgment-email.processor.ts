import { Job } from 'bullmq';
import { prisma } from '@dms/database';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';

interface AcknowledgmentJobData {
  donationId: string;
  donorEmail: string;
}

export async function sendAcknowledgmentEmail(job: Job<AcknowledgmentJobData>) {
  const { donationId, donorEmail } = job.data;

  try {
    // Fetch donation details
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: true,
        cause: true,
      },
    });

    if (!donation) {
      throw new Error(`Donation not found: ${donationId}`);
    }

    // Generate email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .donation-details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Donation</h1>
          </div>
          
          <div class="content">
            <p>Dear ${donation.donor?.firstName} ${donation.donor?.lastName},</p>
            
            <p>We have received your generous donation and want to express our sincere gratitude for your support.</p>
            
            <div class="donation-details">
              <h3>Donation Details</h3>
              <div class="detail-row">
                <span><strong>Amount:</strong></span>
                <span>$${donation.amount.toFixed(2)} ${donation.currency}</span>
              </div>
              <div class="detail-row">
                <span><strong>Purpose:</strong></span>
                <span>${donation.cause.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${new Date(donation.dateRecorded).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${donation.type}</span>
              </div>
            </div>
            
            <p>Your donation has been validated and will be processed for your tax receipt. An official tax receipt will be issued at year-end.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>With gratitude,<br>Temple Administration</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Halton-Peel Buddhist Cultural Society</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to: donorEmail,
      subject: `Donation Acknowledgment - ${donation.cause.name}`,
      html: emailHtml,
    });

    logger.info(`Acknowledgment email sent for donation: ${donationId}`);

    return { success: true, donationId };
  } catch (error) {
    logger.error(`Failed to send acknowledgment email for donation: ${donationId}`, error);
    throw error;
  }
}
