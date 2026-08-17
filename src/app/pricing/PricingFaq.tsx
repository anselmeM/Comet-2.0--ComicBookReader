'use client';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-neutral-950 border-2 border-neutral-850 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.02)] hover:border-comet-orange hover:shadow-[4px_4px_0px_0px_var(--color-comet-orange)] transition-all">
      <h4 className="text-lg font-heading font-black mb-4 text-white uppercase italic tracking-wide">
        {question}
      </h4>

      <p className="text-neutral-400 text-sm font-medium leading-relaxed">{answer}</p>
    </div>
  );
}

/** Common Questions FAQ. */
export const PricingFaq = () => {
  return (
    <section className="mt-48 w-full max-w-3xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-heading font-black uppercase italic tracking-tighter text-white">
          Common Questions
        </h2>
      </div>

      <div className="space-y-6">
        <FAQItem
          question="What happens to my comics if I cancel Premium?"
          answer="Your comics stay in your local library! You'll only lose access to the cloud backup and automatic syncing features. Any comics already synced to the cloud will remain there for 30 days before being purged."
        />
        <FAQItem
          question="How secure is the Cloud Sync?"
          answer="Comet uses industry-standard AES-256 encryption for files at rest and secure SSL/TLS for all data transfers. We never share your library data with third parties."
        />
        <FAQItem
          question="Can I upgrade from Free later?"
          answer="Absolutely. You can upgrade or downgrade at any time through your account settings. All your reading progress and metadata will be preserved regardless of your tier."
        />
      </div>
    </section>
  );
};
