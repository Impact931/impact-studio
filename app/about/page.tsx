import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About | Impact Studio',
  description:
    "Learn about Impact Studio — Clarksville's premier photography studio and equipment rental space, powered by JHR Photography LLC.",
};

export default function AboutPage() {
  return <AboutClient />;
}
