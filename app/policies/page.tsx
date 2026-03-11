import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rental Policies & Procedures | Impact Studio',
  description: 'Impact Studio rental policies — insurance requirements, security deposits, late returns, damage & loss, cancellation, and equipment care.',
};

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-text sm:text-4xl">
        Rental Policies &amp; Procedures
      </h1>
      <p className="mt-3 text-brand-muted">
        Please review the following policies before booking studio time or renting equipment.
      </p>

      <div className="mt-12 space-y-12">
        {/* Insurance */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">1. Insurance Requirements</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <p>
              A Certificate of Insurance (COI) is required for all rentals with a combined equipment
              replacement value exceeding $15,000. Your COI must:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Name JHR Photography LLC (d/b/a Impact Studio) as Additional Insured and Loss Payee</li>
              <li>Carry minimum coverage of $1,000,000 per occurrence / $2,000,000 general aggregate</li>
              <li>Include off-premises coverage for &ldquo;rented equipment from others&rdquo;</li>
              <li>Cover the full rental period with no gaps</li>
            </ul>
            <p>
              Homeowners, renters, and general liability policies are <strong className="text-brand-text">not accepted</strong>.
            </p>
            <p>
              For rentals under $15,000 replacement value, insurance is strongly recommended but not required.
              If you do not provide a COI, a security deposit hold will be placed on your credit card.
            </p>
          </div>
        </section>

        {/* Security Deposits */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">2. Security Deposits &amp; Credit Card Holds</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <p>
              A credit card authorization hold equal to the <strong className="text-brand-text">full replacement value</strong> of
              all rented equipment will be placed at checkout for renters without a COI on file.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>This hold is <strong className="text-brand-text">not a charge</strong> — it is an authorization only</li>
              <li>The hold will be released within <strong className="text-brand-text">72 hours</strong> of equipment return and satisfactory inspection</li>
              <li>Maximum credit card hold: <strong className="text-brand-text">$15,000</strong></li>
              <li>Rentals exceeding $15,000 replacement value require insurance</li>
            </ul>
          </div>
        </section>

        {/* Late Returns */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">3. Late Return Policy</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <ul className="list-disc space-y-1 pl-5">
              <li>Rental extensions must be requested by <strong className="text-brand-text">5:00 PM the day before</strong> the scheduled return date</li>
              <li>Late returns without prior arrangement will be charged at the <strong className="text-brand-text">full daily rate</strong> for each day (or partial day exceeding 2 hours) past the return deadline</li>
              <li>Equipment not returned within <strong className="text-brand-text">7 days</strong> of the scheduled return date, with no communication, will be considered lost and the full replacement value will be charged</li>
            </ul>
          </div>
        </section>

        {/* Damage & Loss */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">4. Damage &amp; Loss Policy</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <ul className="list-disc space-y-1 pl-5">
              <li>Renter is responsible for <strong className="text-brand-text">all repair costs</strong> at manufacturer-authorized service centers</li>
              <li>For total loss, theft, or irreparable damage: renter pays <strong className="text-brand-text">full replacement cost</strong> at current market value</li>
              <li>Missing accessories (lens caps, hoods, bags, cables, chargers): renter pays full replacement cost of each item</li>
              <li>Renter must <strong className="text-brand-text">not</strong> attempt to repair equipment — report all damage immediately</li>
              <li>Payment for damage or loss is due within <strong className="text-brand-text">3 business days</strong> of receiving the cost notice</li>
            </ul>
          </div>
        </section>

        {/* Cancellation */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">5. Cancellation Policy</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <div className="overflow-hidden rounded-lg border border-brand-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-light">
                  <tr>
                    <th className="px-4 py-3 font-medium text-brand-text">Timing</th>
                    <th className="px-4 py-3 font-medium text-brand-text">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  <tr><td className="px-4 py-3">7+ days before rental start</td><td className="px-4 py-3">Full refund minus $25 processing fee</td></tr>
                  <tr><td className="px-4 py-3">48 hours &ndash; 7 days before</td><td className="px-4 py-3">50% refund</td></tr>
                  <tr><td className="px-4 py-3">Less than 48 hours</td><td className="px-4 py-3">No refund</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Cancellations and changes must be made <strong className="text-brand-text">via phone</strong> with studio management: <a href="tel:6152498096" className="text-brand-accent">615-249-8096</a>
            </p>
            <p>No-shows are charged the full rental fee.</p>
          </div>
        </section>

        {/* Equipment Care */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">6. Equipment Care &amp; Responsibilities</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <ul className="list-disc space-y-1 pl-5">
              <li>All equipment must be returned clean, dry, and in its provided case or bag</li>
              <li>Do not expose equipment to extreme temperatures, moisture, sand, or salt water without prior written approval</li>
              <li>Renter is responsible for equipment security at all times during the rental period</li>
              <li>Subletting or transferring rented equipment to a third party is prohibited</li>
            </ul>
          </div>
        </section>

        {/* Prohibited Use */}
        <section>
          <h2 className="font-display text-xl font-bold text-brand-text">7. Prohibited Use</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <p>The following uses of rented equipment are prohibited and may result in immediate termination of the rental agreement:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use in hazardous environments without prior written approval</li>
              <li>Modification, disassembly, or attempted repair of equipment</li>
              <li>Use for any illegal activity</li>
              <li>Subletting to any third party</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-16 rounded-lg border border-brand-border bg-brand-light p-6">
        <p className="text-sm text-brand-muted">
          <strong className="text-brand-text">Questions?</strong> Contact our studio management team at{' '}
          <a href="tel:6152498096" className="text-brand-accent">615-249-8096</a> or{' '}
          <a href="mailto:info@impactstudio931.com" className="text-brand-accent">info@impactstudio931.com</a>.
        </p>
      </div>
    </div>
  );
}
