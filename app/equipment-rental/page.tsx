import type { Metadata } from 'next';
import EquipmentRentalClient from './EquipmentRentalClient';

export const metadata: Metadata = {
  title: 'Equipment Rental | Impact Studio',
  description:
    'Browse and rent professional photography equipment — lighting bundles, strobes, modifiers, grip gear, and more. In-studio and out-of-studio pricing available.',
};

export default function EquipmentRentalPage() {
  return <EquipmentRentalClient />;
}
