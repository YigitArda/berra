'use client';

import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const steps = [
  'Bütçe',
  'Sıfır vs İkinci El',
  'Yakıt Tipi',
  'Model Önerileri',
  'Test/Muayene',
  'Alım Sonrası',
] as const;

export default function RehberPage() {
  const [step, setStep] = useState(0);
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">İlk Araba Rehberi</h1>
        <p className="mt-2 text-sm text-slate-300">6 adımda doğru aracı seçin.</p>
        <div className="mt-3 h-2 rounded bg-slate-800">
          <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">%{progress} tamamlandı</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Adım {step + 1}: {steps[step]}</h2>
        {step === 0 && <p className="mt-2 text-sm">Bütçe slider'ı ile aylık toplam maliyeti planlayın (yakıt + bakım + sigorta).</p>}
        {step === 1 && <p className="mt-2 text-sm">Sıfır araç: garanti avantajı, ikinci el: fiyat avantajı.</p>}
        {step === 2 && <p className="mt-2 text-sm">Benzin / Dizel / LPG / Elektrik kullanım senaryonuza göre seçin.</p>}
        {step === 3 && <p className="mt-2 text-sm">Öneriler: Corolla, Civic, Clio, Egea, i20, Megane.</p>}
        {step === 4 && <p className="mt-2 text-sm">Ekspertiz, test sürüşü, şasi kontrolü ve bakım geçmişi checklisti.</p>}
        {step === 5 && <p className="mt-2 text-sm">Sigorta, ilk bakım, lastik ve acil durum seti kontrolü.</p>}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>Önceki</Button>
        <Button disabled={step === steps.length - 1} onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}>Sonraki</Button>
      </div>
    </div>
  );
}
