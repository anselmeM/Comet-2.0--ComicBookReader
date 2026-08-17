'use client';

function ComparisonRow({ label, free, premium }: { label: string; free: string; premium: string }) {
  return (
    <tr className="border-b border-neutral-850 hover:bg-neutral-900/30 transition-colors">
      <td className="py-5 px-4 text-sm font-heading font-black text-neutral-200 uppercase tracking-wide">
        {label}
      </td>

      <td className="py-5 px-4 text-sm text-center text-neutral-400 font-medium">{free}</td>

      <td className="py-5 px-4 text-sm text-center font-heading font-black text-comet-orange uppercase tracking-wide">
        {premium}
      </td>
    </tr>
  );
}

/** Deep Space Comparison table. */
export const PricingComparison = () => {
  return (
    <section className="mt-48 w-full max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-heading font-black uppercase italic tracking-tighter text-white">
          Deep Space Comparison
        </h2>
      </div>

      <div className="overflow-x-auto border-3 border-neutral-950 bg-neutral-950/40 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-800">
              <th className="py-6 px-4 text-xs font-heading font-black uppercase tracking-wider text-neutral-400">
                Feature
              </th>

              <th className="py-6 px-4 text-xs font-heading font-black uppercase tracking-wider text-center text-white">
                Free
              </th>

              <th className="py-6 px-4 text-xs font-heading font-black uppercase tracking-wider text-center text-comet-orange">
                Premium
              </th>
            </tr>
          </thead>

          <tbody className="font-medium">
            <ComparisonRow label="Local Library Storage" free="Unlimited" premium="Unlimited" />
            <ComparisonRow label="Cloud Sync (S3/R2)" free="Yes" premium="Unlimited" />
            <ComparisonRow label="Reading Progress Sync" free="Yes" premium="Yes" />
            <ComparisonRow label="Manual Metadata Editor" free="Yes" premium="Yes" />
            <ComparisonRow
              label="Automatic Enrichment"
              free="Manual Trigger"
              premium="Unlimited Auto"
            />
            <ComparisonRow label="Multiple Devices" free="Yes" premium="Seamless Sync" />
            <ComparisonRow label="Advertisements" free="Yes" premium="None" />
          </tbody>
        </table>
      </div>
    </section>
  );
};
