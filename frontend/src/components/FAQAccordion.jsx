import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqData = [
    {
        q: 'How fast is verification?',
        a: 'Verification typically completes within seconds. Once the wallet is connected, our system queries the blockchain registry and returns proof almost instantly — no waiting, no manual review.',
    },
    {
        q: 'Is my academic data secure?',
        a: 'Absolutely. Your credentials are verified through cryptographic proofs on-chain. Seal It never stores raw academic data — only signed verification hashes that cannot be tampered with.',
    },
    {
        q: 'Can credentials be revoked?',
        a: 'Yes. Issuing institutions can revoke credentials at any time by updating the on-chain record. Seal It continuously checks revocation status during every verification.',
    },
    {
        q: 'Do recruiters need accounts?',
        a: 'No. Recruiters can verify credentials using a public verification link or QR code. No wallet required — they simply view the blockchain-confirmed proof of authenticity.',
    },
];

const FAQAccordion = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    return (
        <section className="faq-section">
            <h2 className="faq-heading text-gradient">Frequently Asked Questions</h2>
            <p className="faq-subheading">Everything you need to know about Seal It.</p>

            {faqData.map((item, i) => (
                <div key={i} className={`faq-item ${openIndex === i ? 'active' : ''}`}>
                    <button className="faq-question" onClick={() => toggle(i)}>
                        <span>{item.q}</span>
                        <ChevronDown className="faq-chevron" />
                    </button>
                    <div className="faq-answer">
                        <div className="faq-answer-inner">{item.a}</div>
                    </div>
                </div>
            ))}
        </section>
    );
};

export default FAQAccordion;
