'use client';

import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';

type CarInput = {
  brand: string;
  model: string;
  year: number;
  km: number;
  price: number;
  fuel: string;
  transmission: string;
};

const reliability: Record<string, number> = {
  toyota: 2,
  honda: 2,
  mazda: 1.8,
  bmw: 1.2,
  mercedes: 1.3,
  volkswagen: 1.4,
  renault: 1.4,
  fiat: 1.3,
  ford: 1.5,
  hyundai: 1.7,
  kia: 1.7,
};

function score(car: CarInput) {
  const age = Math.max(new Date().getFullYear() - car.year, 0);
  const ageScore = Math.max(3 - age / 8, 0);
  const kmScore = Math.max(3 - car.km / 120000, 0);
  const valueScore = car.price > 0 ? Math.min(2, 1500000 / car.price) : 0;
  const brandScore = reliability[car.brand.toLowerCase()] ?? 1;
  const total = ageScore + kmScore + valueScore + brandScore;
  const verdict = total >= 7.5 ? '✓ ALINIR' : total >= 5 ? '~ DÜŞÜN' : '✗ ALINMAZ';
  return { total: Number(total.toFixed(2)), verdict };
}

const initialCar = { brand: '', model: '', year: 2018, km: 90000, price: 900000, fuel: 'Benzin', transmission: 'Otomatik' };

export default function ComparePage() {
  const [left, setLeft] = useState<CarInput>(initialCar);
  const [right, setRight] = useState<CarInput>(initialCar);
  const [showResult, setShowResult] = useState(false);

  const leftResult = useMemo(() => score(left), [left]);
  const rightResult = useMemo(() => score(right), [right]);

  const winner = leftResult.total === rightResult.total ? 'Berabere' : leftResult.total > rightResult.total ? 'Sol araç önde' : 'Sağ araç önde';

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">⚖️ Araç Karşılaştırma</h1>
        <p className="mt-1 text-sm text-slate-300">İki aracı puanlayıp karar desteği alın.</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {[{ label: 'Araç A', car: left, setCar: setLeft }, { label: 'Araç B', car: right, setCar: setRight }].map((item) => (
          <Card key={item.label}>
            <h2 className="mb-3 text-lg font-semibold">{item.label}</h2>
            <div className="grid gap-2">
              <FormField id={`${item.label}-brand`} label="Marka"><Input id={`${item.label}-brand`} value={item.car.brand} onChange={(e) => item.setCar({ ...item.car, brand: e.target.value })} /></FormField>
              <FormField id={`${item.label}-model`} label="Model"><Input id={`${item.label}-model`} value={item.car.model} onChange={(e) => item.setCar({ ...item.car, model: e.target.value })} /></FormField>
              <FormField id={`${item.label}-year`} label="Yıl"><Input id={`${item.label}-year`} type="number" value={item.car.year} onChange={(e) => item.setCar({ ...item.car, year: Number(e.target.value) })} /></FormField>
              <FormField id={`${item.label}-km`} label="KM"><Input id={`${item.label}-km`} type="number" value={item.car.km} onChange={(e) => item.setCar({ ...item.car, km: Number(e.target.value) })} /></FormField>
              <FormField id={`${item.label}-price`} label="Fiyat"><Input id={`${item.label}-price`} type="number" value={item.car.price} onChange={(e) => item.setCar({ ...item.car, price: Number(e.target.value) })} /></FormField>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-center">
        <Button onClick={() => setShowResult(true)}>Karşılaştır</Button>
      </div>

      {showResult && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">Araç A Skoru</h3>
            <p className="mt-2 text-3xl font-bold">{leftResult.total}</p>
            <p className="mt-1">{leftResult.verdict}</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Araç B Skoru</h3>
            <p className="mt-2 text-3xl font-bold">{rightResult.total}</p>
            <p className="mt-1">{rightResult.verdict}</p>
          </Card>
          <Card className="lg:col-span-2"><p className="text-center text-lg font-semibold">Kazanan: {winner}</p></Card>
        </div>
      )}
    </div>
  );
}
