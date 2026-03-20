import type { Metadata } from 'next';
import StudioRentalClient from './StudioRentalClient';

export const metadata: Metadata = {
  title: 'Studio Rental | Impact Studio',
  description:
    'Book our professional photography studio in Clarksville, TN. Cyclorama wall, seamless backgrounds, professional lighting. Hourly, half-day, and full-day packages.',
};

export default function StudioRentalPage() {
  return <StudioRentalClient />;
}
