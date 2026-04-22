"use client";
import { CONTACT_EMAIL, RESTAURANT_PHONE } from "@/lib/config";

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Contact us
        </h1>
        <p className="max-w-2xl text-sm text-neutral-700">
          Have a question about the menu, allergies, or catering? Use the form
          below or call us directly. Messages are sent to the restaurant&apos;s
          email inbox.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <ContactForm />
        <aside className="space-y-3 rounded-2xl bg-white p-4 text-sm text-neutral-700 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
            Quick contact
          </h2>
          <p>
            Phone:{" "}
            <a
              href={`tel:${RESTAURANT_PHONE}`}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              {RESTAURANT_PHONE}
            </a>
          </p>
          <p>
            Email:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-neutral-600">
            For urgent order changes, please call the restaurant so we can
            update your ticket right away.
          </p>
        </aside>
      </section>
    </div>
  );
}



import { contactFormSchema } from "@/lib/validation";
import { FormEvent, useState } from "react";

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const input = { name, email, message };
    const parsed = contactFormSchema.safeParse(input);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Please review the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        throw new Error("Failed to send message.");
      }
      setName("");
      setEmail("");
      setMessage("");
      setSuccess("Thank you! Your message has been sent.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-4 shadow-sm"
      aria-label="Contact form"
    >
      <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
        Send us a message
      </h2>
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {success}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-2xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

