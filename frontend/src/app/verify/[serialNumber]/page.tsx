import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicCertificate } from '@/features/account/services/account.api';
import { PublicCertificateView } from '@/features/verify/components/PublicCertificateView';

interface VerifyPageProps {
  readonly params: Promise<{
    readonly serialNumber: string;
  }>;
  readonly searchParams: Promise<{
    readonly token?: string;
  }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { serialNumber } = await params;
  const canonical = decodeURIComponent(serialNumber).toUpperCase();

  return {
    title: `Verify ${canonical} | Official Certificate | ARM Exhaust`,
    description: `Official authenticity registry and manufacturing provenance verification for ARM Exhaust serial ${canonical}.`,
  };
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { serialNumber } = await params;
  const { token } = await searchParams;
  const decodedSerial = decodeURIComponent(serialNumber).toUpperCase();
  const certificate = await fetchPublicCertificate(decodedSerial, token);

  if (!certificate || !certificate.isAuthentic) {
    notFound();
  }

  return (
    <PublicCertificateView
      certificate={certificate}
      serialNumber={decodedSerial}
      token={token}
    />
  );
}
