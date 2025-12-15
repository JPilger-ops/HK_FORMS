'use client';

import { ComponentType, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

type Props = {
  onChange: (value: string) => void;
};

export function SignaturePad({ onChange }: Props) {
  const SignatureCanvasAny = SignatureCanvas as unknown as ComponentType<any>;
  const ref = useRef<SignatureCanvas | null>(null);

  const handleEnd = () => {
    const data = ref.current?.toDataURL('image/png');
    if (data) {
      onChange(data);
    }
  };

  return (
    <div>
      <SignatureCanvasAny
        ref={ref as any}
        penColor="#0f172a"
        backgroundColor="#fff"
        canvasProps={{ className: 'h-48 w-full rounded border border-slate-300 bg-white' }}
        onEnd={handleEnd}
      />
      <button
        type="button"
        onClick={() => {
          ref.current?.clear();
          handleEnd();
        }}
        className="mt-2 text-sm text-brand underline"
      >
        Zurücksetzen
      </button>
    </div>
  );
}
