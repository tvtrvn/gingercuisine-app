import {
  RESTAURANT_ADDRESS,
  RESTAURANT_HOURS,
  RESTAURANT_PHONE,
} from "@/lib/config";

export default function LocationPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Location &amp; hours
        </h1>
        <p className="max-w-2xl text-sm text-neutral-700">
          Find our family Vietnamese restaurant, see opening hours, and plan
            your visit.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
            Address &amp; contact
          </h2>
          <p className="text-sm text-neutral-800">{RESTAURANT_ADDRESS}</p>
          <a
            href={`tel:${RESTAURANT_PHONE}`}
            className="block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            {RESTAURANT_PHONE}
          </a>
          <div className="mt-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Hours
            </h3>
            <p className="mt-1 text-sm text-neutral-800">{RESTAURANT_HOURS}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-1">
          <iframe
            title="Google Maps location"
            aria-label="Map showing restaurant location"
            className="h-72 w-full rounded-2xl"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.172402872174!2d-79.38362402376649!3d43.66538415164262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34b3284c5cf1%3A0x514b5f0ea077388a!2sPho%20Ginger!5e0!3m2!1sen!2sca!4v1772558773033!5m2!1sen!2sca"
          ></iframe>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
          Parking &amp; transit
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Street parking and nearby lots.</li>
          <li>Close to major bus and streetcar routes.</li>
          <li>
            Ideal for quick pickup—order online, then swing by when your food is
            ready.
          </li>
        </ul>
      </section>
    </div>
  );
}

