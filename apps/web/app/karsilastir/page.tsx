'use client';

import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';

type FuelType = 'Benzin' | 'Dizel' | 'LPG' | 'Elektrik';
type Transmission = 'Manuel' | 'Otomatik';

type CarInput = {
  brand: string;
  model: string;
  year: number;
  km: number;
  price: number;
  fuel: FuelType;
  transmission: Transmission;
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

const fuelScoreMap: Record<FuelType, number> = {
  Elektrik: 1,
  LPG: 0.8,
  Dizel: 0.7,
  Benzin: 0.6,
};

const transmissionScoreMap: Record<Transmission, number> = {
  Otomatik: 0.6,
  Manuel: 0.5,
};

function score(car: CarInput) {
  const age = Math.max(new Date().getFullYear() - car.year, 0);
  const ageScore = Math.max(3 - age / 8, 0); // 3 max
  const kmScore = Math.max(3 - car.km / 120000, 0); // 3 max
  const valueScore = car.price > 0 ? Math.min(2, 1500000 / car.price) : 0; // 2 max
  const brandScore = reliability[car.brand.toLowerCase()] ?? 1; // 2 max
  const fuelScore = fuelScoreMap[car.fuel]; // 1 max
  const transmissionScore = transmissionScoreMap[car.transmission]; // 0.6 max
  const total = ageScore + kmScore + valueScore + brandScore + fuelScore + transmissionScore;
  const verdict = total >= 8.5 ? '✓ ALINIR' : total >= 6.5 ? '~ DÜŞÜN' : '✗ ALINMAZ';

  return {
    total: Number(total.toFixed(2)),
    verdict,
    details: {
      ageScore: Number(ageScore.toFixed(2)),
      kmScore: Number(kmScore.toFixed(2)),
      valueScore: Number(valueScore.toFixed(2)),
      brandScore: Number(brandScore.toFixed(2)),
      fuelScore: Number(fuelScore.toFixed(2)),
      transmissionScore: Number(transmissionScore.toFixed(2)),
    },
  };
}

const initialCar: CarInput = {
  brand: '',
  model: '',
  year: 2018,
  km: 90000,
  price: 900000,
  fuel: 'Benzin',
  transmission: 'Otomatik',
};

function CarForm({
  label,
  car,
  setCar,
}: {
  label: string;
  car: CarInput;
  setCar: (next: CarInput) => void;
}) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">{label}</h2>
      <div className="grid gap-2">
        <FormField id={`${label}-brand`} label="Marka">
          <Input id={`${label}-brand`} value={car.brand} onChange={(e) => setCar({ ...car, brand: e.target.value })} />
        </FormField>
        <FormField id={`${label}-model`} label="Model">
          <Input id={`${label}-model`} value={car.model} onChange={(e) => setCar({ ...car, model: e.target.value })} />
        </FormField>
        <FormField id={`${label}-year`} label="Yıl">
          <Input id={`${label}-year`} type="number" value={car.year} onChange={(e) => setCar({ ...car, year: Number(e.target.value) })} />
        </FormField>
        <FormField id={`${label}-km`} label="KM">
          <Input id={`${label}-km`} type="number" value={car.km} onChange={(e) => setCar({ ...car, km: Number(e.target.value) })} />
        </FormField>
        <FormField id={`${label}-price`} label="Fiyat">
          <Input id={`${label}-price`} type="number" value={car.price} onChange={(e) => setCar({ ...car, price: Number(e.target.value) })} />
        </FormField>
        <FormField id={`${label}-fuel`} label="Yakıt tipi">
          <select
            id={`${label}-fuel`}
            value={car.fuel}
            onChange={(e) => setCar({ ...car, fuel: e.target.value as FuelType })}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <option value="Benzin">Benzin</option>
            <option value="Dizel">Dizel</option>
            <option value="LPG">LPG</option>
            <option value="Elektrik">Elektrik</option>
          </select>
        </FormField>
        <FormField id={`${label}-transmission`} label="Şanzıman">
          <select
            id={`${label}-transmission`}
            value={car.transmission}
            onChange={(e) => setCar({ ...car, transmission: e.target.value as Transmission })}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <option value="Otomatik">Otomatik</option>
            <option value="Manuel">Manuel</option>
          </select>
        </FormField>
      </div>
    </Card>
  );
}

export default function ComparePage() {
  const [left, setLeft] = useState<CarInput>(initialCar);
  const [right, setRight] = useState<CarInput>(initialCar);
  const [showResult, setShowResult] = useState(false);

  const leftResult = useMemo(() => score(left), [left]);
  const rightResult = useMemo(() => score(right), [right]);

  const winner =
    leftResult.total === rightResult.total
      ? 'Berabere'
      : leftResult.total > rightResult.total
        ? `${left.brand || 'Araç A'} önde`
        : `${right.brand || 'Araç B'} önde`;

  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-bold">⚖️ Araç Karşılaştırma</h1>
        <p className="mt-1 text-sm text-slate-300">
          Yaş (3), KM (3), Fiyat/Değer (2), Marka Güvenilirliği (2), Yakıt (1), Şanzıman (0.6)
          üzerinden toplam skor hesaplanır.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CarForm label="Araç A" car={left} setCar={setLeft} />
        <CarForm label="Araç B" car={right} setCar={setRight} />
      </div>

      <div className="flex justify-center">
        <Button onClick={() => setShowResult(true)} disabled={!left.brand || !left.model || !right.brand || !right.model}>
          Karşılaştır
        </Button>
      </div>

      {showResult && (
        <>
          <Card className="text-center">
            <p className="text-lg font-semibold">Kazanan: {winner}</p>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">{left.brand} {left.model}</h3>
              <p className="mt-2 text-3xl font-bold">{leftResult.total}</p>
              <p className="mt-1">{leftResult.verdict}</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
                <li>Yaş puanı: {leftResult.details.ageScore}</li>
                <li>KM puanı: {leftResult.details.kmScore}</li>
                <li>Fiyat/değer: {leftResult.details.valueScore}</li>
                <li>Marka güvenilirliği: {leftResult.details.brandScore}</li>
                <li>Yakıt puanı: {leftResult.details.fuelScore}</li>
                <li>Şanzıman puanı: {leftResult.details.transmissionScore}</li>
              </ul>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold">{right.brand} {right.model}</h3>
              <p className="mt-2 text-3xl font-bold">{rightResult.total}</p>
              <p className="mt-1">{rightResult.verdict}</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
                <li>Yaş puanı: {rightResult.details.ageScore}</li>
                <li>KM puanı: {rightResult.details.kmScore}</li>
                <li>Fiyat/değer: {rightResult.details.valueScore}</li>
                <li>Marka güvenilirliği: {rightResult.details.brandScore}</li>
                <li>Yakıt puanı: {rightResult.details.fuelScore}</li>
                <li>Şanzıman puanı: {rightResult.details.transmissionScore}</li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
