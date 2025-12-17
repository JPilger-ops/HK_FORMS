import type { Metadata } from 'next';
import { InvalidRequestNotice } from './invalid-request';

export const metadata: Metadata = {
  title: 'Ungültiger oder abgelaufener Code',
  description: 'Dieser Einladungslink ist ungültig oder wurde bereits benutzt.'
};

export default function InvalidRequestPage() {
  return <InvalidRequestNotice />;
}
