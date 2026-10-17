interface BookingEmailData {
  userName: string;
  bookingId: string;
  type: string;
  details: any;
  totalAmount: number;
  currency: string;
}

export function getBookingConfirmationEmail(data: BookingEmailData): { subject: string; text: string; html: string } {
  const subject = `Booking Confirmation - ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} #${data.bookingId}`;

  const details = data.type === 'hotel'
    ? `Hotel: ${data.details.hotelName}
Check-in: ${data.details.checkIn}
Check-out: ${data.details.checkOut}
Nights: ${data.details.nights}
Guests: ${data.details.guests}`
    : `Flight: ${data.details.airline} ${data.details.flightNumber}
From: ${data.details.departure.city} (${data.details.departure.time})
To: ${data.details.arrival.city} (${data.details.arrival.time})
Date: ${data.details.departure.date}
Passengers: ${data.details.passengers}`;

  const text = `Dear ${data.userName},

Thank you for your booking! Here are your booking details:

Booking ID: ${data.bookingId}
Type: ${data.type}

${details}

Total Amount: ${data.totalAmount} ${data.currency}

You can view your booking details and manage your reservation at:
https://dev.by.team/bookings/${data.bookingId}

If you have any questions, please don't hesitate to contact us.

Best regards,
TravelWorld Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 20px; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Booking Confirmation</h2>
      <p>Dear ${data.userName},</p>
      <p>Thank you for your booking! Here are your booking details:</p>
    </div>
    
    <div class="details">
      <p><strong>Booking ID:</strong> ${data.bookingId}</p>
      <p><strong>Type:</strong> ${data.type}</p>
      
      ${data.type === 'hotel' ? `
        <p><strong>Hotel:</strong> ${data.details.hotelName}</p>
        <p><strong>Check-in:</strong> ${data.details.checkIn}</p>
        <p><strong>Check-out:</strong> ${data.details.checkOut}</p>
        <p><strong>Nights:</strong> ${data.details.nights}</p>
        <p><strong>Guests:</strong> ${data.details.guests}</p>
      ` : `
        <p><strong>Flight:</strong> ${data.details.airline} ${data.details.flightNumber}</p>
        <p><strong>From:</strong> ${data.details.departure.city} (${data.details.departure.time})</p>
        <p><strong>To:</strong> ${data.details.arrival.city} (${data.details.arrival.time})</p>
        <p><strong>Date:</strong> ${data.details.departure.date}</p>
        <p><strong>Passengers:</strong> ${data.details.passengers}</p>
      `}
      
      <p><strong>Total Amount:</strong> ${data.totalAmount} ${data.currency}</p>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="https://dev.by.team/bookings/${data.bookingId}" class="button">View Booking Details</a>
    </div>
    
    <div class="footer">
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>TravelWorld Team</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function getBookingCancellationEmail(data: BookingEmailData): { subject: string; text: string; html: string } {
  const subject = `Booking Cancellation - ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} #${data.bookingId}`;

  const text = `Dear ${data.userName},

Your booking has been cancelled as requested. Here are the details:

Booking ID: ${data.bookingId}
Type: ${data.type}
Refund Amount: ${data.totalAmount} ${data.currency}

The refund has been processed and will be credited to your account balance.

You can view your booking history at:
https://dev.by.team/bookings

If you have any questions, please don't hesitate to contact us.

Best regards,
TravelWorld Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 20px; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Booking Cancellation</h2>
      <p>Dear ${data.userName},</p>
      <p>Your booking has been cancelled as requested. Here are the details:</p>
    </div>
    
    <div class="details">
      <p><strong>Booking ID:</strong> ${data.bookingId}</p>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>Refund Amount:</strong> ${data.totalAmount} ${data.currency}</p>
      <p>The refund has been processed and will be credited to your account balance.</p>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="https://dev.by.team/bookings" class="button">View Booking History</a>
    </div>
    
    <div class="footer">
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>TravelWorld Team</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
