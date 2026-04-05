import jsPDF from 'jspdf';
import { Booking } from '@/types/database';
import { format, parseISO } from 'date-fns';

export function generateTicketPDF(booking: Booking) {
  const movie = booking.showtime?.movie;
  const screen = booking.showtime?.screen;
  const theatre = screen?.theatre;
  const seats = booking.booked_seats?.map((bs) => bs.seat!) || [];

  if (!movie || !booking.showtime) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 220] });

  // Background
  doc.setFillColor(15, 15, 20);
  doc.rect(0, 0, 100, 220, 'F');

  // Header gradient bar
  doc.setFillColor(229, 9, 20);
  doc.rect(0, 0, 100, 4, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 4, 100, 1.5, 'F');

  // CineBook Logo
  doc.setTextColor(229, 9, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CineBook', 50, 18, { align: 'center' });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('MOVIE TICKET', 50, 24, { align: 'center' });

  // Divider
  doc.setDrawColor(50, 50, 60);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(10, 30, 90, 30);

  // Movie Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(movie.title, 75);
  doc.text(titleLines, 50, 42, { align: 'center' });
  const titleEndY = 42 + (titleLines.length - 1) * 6;

  // Genre
  if (movie.genre?.length) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(movie.genre.join(' • '), 50, titleEndY + 6, { align: 'center' });
  }

  let y = titleEndY + 16;

  // Info Grid
  const drawField = (label: string, value: string, x: number, yPos: number) => {
    doc.setTextColor(120, 120, 130);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x, yPos);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x, yPos + 5);
  };

  drawField('Date', format(parseISO(booking.showtime.show_date), 'EEE, MMM d, yyyy'), 12, y);
  drawField('Time', format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a'), 62, y);

  y += 16;
  drawField('Theatre', theatre?.name || 'N/A', 12, y);
  drawField('Screen', screen?.name || 'N/A', 62, y);

  y += 16;
  drawField('Seats', seats.map((s) => `${s.row_label}${s.seat_number}`).join(', '), 12, y);
  drawField('Tickets', `${seats.length}`, 62, y);

  // Tear line
  y += 18;
  doc.setDrawColor(50, 50, 60);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(8, y, 92, y);
  // Circle cutouts
  doc.setFillColor(0, 0, 0);
  doc.circle(5, y, 4, 'F');
  doc.circle(95, y, 4, 'F');

  // Total section
  y += 10;
  doc.setTextColor(120, 120, 130);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL PAID', 12, y);
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${Number(booking.total_amount).toFixed(0)}`, 12, y + 8);

  // Booking ID
  doc.setTextColor(120, 120, 130);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('BOOKING ID', 62, y);
  doc.setTextColor(229, 9, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.id.slice(0, 8).toUpperCase(), 62, y + 7);

  // Footer
  y += 22;
  doc.setDrawColor(50, 50, 60);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(10, y, 90, y);

  y += 8;
  doc.setTextColor(100, 100, 110);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Show this ticket at the theatre counter', 50, y, { align: 'center' });
  doc.text('Enjoy the show! 🎬', 50, y + 5, { align: 'center' });

  // Bottom gradient bar
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 218.5, 100, 1.5, 'F');

  // Save
  doc.save(`CineBook-Ticket-${booking.id.slice(0, 8).toUpperCase()}.pdf`);
}
