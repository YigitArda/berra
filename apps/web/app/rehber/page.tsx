'use client';

import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const steps = [
  'Bütçe',
  'Sıfır vs İkinci El',
  'Yakıt Tipi',
  'Model Önerileri',
  'Muayene & Test Sürüşü',
  'Alım Sonrası',
] as const;

const suggestedModels = ['Toyota Corolla', 'Honda Civic', 'Renault Clio', 'Fiat Egea', 'Hyundai i20', 'VW Golf'];

export default function RehberPage() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(600000);
  const [fuel, setFuel] = useState<'Benzin' | 'Dizel' | 'LPG' | 'Elektrik'>('Benzin');
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">İlk Araba Rehberi</h1>
        <p className="mt-2 text-sm text-slate-300">6 adımlı seçim sihirbazı.</p>
        <div className="mt-3 h-2 rounded bg-slate-800">
          <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">%{progress} tamamlandı</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Adım {step + 1}: {steps[step]}</h2>

        {step === 0 && (
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-slate-300">Bütçeni belirle (₺200.000 - ₺2.000.000)</p>
            <input type="range" min={200000} max={2000000} step={10000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            <p className="font-semibold">Seçilen bütçe: ₺{budget.toLocaleString('tr-TR')}</p>
            <p className="text-sm text-slate-400">Öneri: Toplam sahip olma maliyetini (yakıt + bakım + sigorta) aylık planla.</p>
          </div>
        )}

        {step === 1 && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded border border-slate-700 p-3">
              <p className="font-semibold">Sıfır Araç</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
                <li>Garanti avantajı</li>
                <li>Düşük ilk arıza riski</li>
                <li>Daha yüksek ilk maliyet</li>
              </ul>
            </div>
            <div className="rounded border border-slate-700 p-3">
              <p className="font-semibold">İkinci El</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
                <li>Daha uygun giriş fiyatı</li>
                <li>Doğru ekspertiz şart</li>
                <li>Bakım geçmişi kritik</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(['Benzin', 'Dizel', 'LPG', 'Elektrik'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded border p-3 text-left ${fuel === item ? 'border-primary bg-primary/10' : 'border-slate-700'}`}
                onClick={() => setFuel(item)}
              >
                <p className="font-semibold">{item}</p>
                <p className="text-sm text-slate-400">Kullanım senaryosuna göre seç.</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-300">Bütçe ve yakıt tercihine göre örnek modeller:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedModels.map((model) => (
                <span key={model} className="rounded-full border border-slate-700 px-3 py-1 text-sm">{model}</span>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
            <li>Ekspertiz raporu al</li>
            <li>Şasi/hasar ve boya kontrolü yap</li>
            <li>Test sürüşünde fren, şanzıman ve sesleri dinle</li>
            <li>Bakım faturalarını doğrula</li>
          </ul>
        )}

        {step === 5 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
            <li>Zorunlu trafik + kasko sigortasını tamamla</li>
            <li>İlk bakım tarihini planla</li>
            <li>Lastik ve akü durumunu kayda al</li>
            <li>Acil durum ekipmanı ekle</li>
          </ul>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>Önceki</Button>
        <Button disabled={step === steps.length - 1} onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}>Sonraki</Button>
      </div>
    </div>
  );
}
