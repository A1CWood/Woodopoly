'use client';

const BILL_AMOUNTS = [500, 100, 50, 20, 10, 5, 1];
const BILL_COLORS: Record<number, string> = {
  500: '#7c3aed',
  100: '#15803d',
  50: '#0369a1',
  20: '#b45309',
  10: '#be123c',
  5: '#0f766e',
  1: '#374151',
};

interface Props {
  amount: number;
  compact?: boolean;
}

function decomposeMoney(total: number) {
  let remaining = total;
  const bills: { denom: number; count: number }[] = [];
  for (const denom of BILL_AMOUNTS) {
    const count = Math.floor(remaining / denom);
    if (count > 0) {
      bills.push({ denom, count: Math.min(count, 5) });
      remaining -= count * denom;
    }
  }
  return bills;
}

export default function MoneyPile({ amount, compact = false }: Props) {
  const bills = decomposeMoney(amount);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex gap-px flex-wrap justify-center max-w-[54px]">
          {bills.slice(0, 6).map(({ denom, count }) =>
            Array.from({ length: Math.min(count, 2) }).map((_, i) => (
              <div
                key={`${denom}-${i}`}
                className="rounded-sm border border-white/30"
                style={{
                  width: 14,
                  height: 8,
                  backgroundColor: BILL_COLORS[denom],
                  fontSize: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 'bold',
                }}
              >
                {denom >= 100 ? denom / 100 + 'c' : denom}
              </div>
            ))
          )}
        </div>
        <span className="text-green-400 font-mono text-[10px] font-bold">
          ${amount.toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Stacked bills */}
      <div className="relative" style={{ width: 48, height: 32 }}>
        {bills.flatMap(({ denom, count }) =>
          Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <div
              key={`${denom}-${i}`}
              className="absolute rounded border border-white/20 flex items-center justify-center"
              style={{
                width: 44,
                height: 22,
                backgroundColor: BILL_COLORS[denom],
                bottom: i * 3,
                left: i * 1,
                fontSize: 7,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 'bold',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              ${denom}
            </div>
          ))
        ).slice(0, 8)}
      </div>
      <span className="text-green-400 font-mono text-xs font-bold">
        ${amount.toLocaleString()}
      </span>
    </div>
  );
}
