import { Job } from 'bullmq';
import { prisma } from '@dms/database';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';

interface AlokaPujaReminderJobData {
  daysAhead: number;
}

export async function sendAlokaPujaReminder(job: Job<AlokaPujaReminderJobData>) {
  const { daysAhead = 7 } = job.data;

  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find Aloka Pujas happening on target date
    const upcomingPujas = await prisma.alokaPuja.findMany({
      where: {
        pujaDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        notificationSent: false,
      },
      include: {
        donor: true,
        rememberedPersons: true,
      },
    });

    logger.info(`Found ${upcomingPujas.length} upcoming Aloka Pujas for ${targetDate.toDateString()}`);

    let sent = 0;
    let errors = 0;

    for (const puja of upcomingPujas) {
      try {
        // Send reminder to donor
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Aloka Puja Reminder</h1>
              </div>
              
              <div class="content">
                <p>Dear ${puja.donor.firstName} ${puja.donor.lastName},</p>
                
                <p>This is a reminder that your scheduled ${puja.pujaType} is coming up in ${daysAhead} days.</p>
                
                <p><strong>Date:</strong> ${new Date(puja.pujaDate).toLocaleDateString()}</p>
                
                ${puja.rememberedPersons.length > 0 ? `
                  <p><strong>Remembering:</strong></p>
                  <ul>
                    ${puja.rememberedPersons.map(person => `
                      <li>${person.firstName} ${person.lastName}</li>
                    `).join('')}
                  </ul>
                ` : ''}
                
                ${puja.notes ? `<p><strong>Notes:</strong> ${puja.notes}</p>` : ''}
                
                <p>May you find peace and blessings on this special day.</p>
                
                <p>With metta,<br>Temple Administration</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: puja.donor.email,
          subject: `Upcoming ${puja.pujaType} - ${new Date(puja.pujaDate).toLocaleDateString()}`,
          html: emailHtml,
        });

        // Mark notification as sent
        await prisma.alokaPuja.update({
          where: { id: puja.id },
          data: {
            notificationSent: true,
            notificationSentAt: new Date(),
          },
        });

        sent++;
        logger.info(`Aloka Puja reminder sent for: ${puja.id}`);
      } catch (error) {
        errors++;
        logger.error(`Failed to send Aloka Puja reminder for: ${puja.id}`, error);
      }
    }

    logger.info(`Aloka Puja reminders completed: ${sent} sent, ${errors} errors`);

    return {
      success: true,
      daysAhead,
      totalPujas: upcomingPujas.length,
      sent,
      errors,
    };
  } catch (error) {
    logger.error('Failed to process Aloka Puja reminders', error);
    throw error;
  }
}
