import { Link } from 'react-router-dom'
import './Legal.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        {/* Header */}
        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms &amp; Conditions</h1>
          <p className="legal-effective">Effective 17 August 2026</p>
          <p className="legal-lead">
            These Terms govern your access to and use of ChallanOne&apos;s website, services and
            platform. By using ChallanOne, you agree to be bound by these Terms. Please read them
            carefully.
          </p>
        </div>

        {/* Sections */}
        <article className="legal-article">

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">1.</span>
              <h2>Definitions</h2>
            </header>
            <div className="legal-body">
              <p>
                <strong>&ldquo;ChallanOne&rdquo;</strong>,{' '}
                <strong>&ldquo;we&rdquo;</strong>,{' '}
                <strong>&ldquo;us&rdquo;</strong> or{' '}
                <strong>&ldquo;our&rdquo;</strong> refers to the operator of this platform,
                India. <strong>&ldquo;You&rdquo;</strong> or{' '}
                <strong>&ldquo;User&rdquo;</strong> refers to any person who accesses or uses
                the Platform. <strong>&ldquo;Platform&rdquo;</strong> means the ChallanOne
                website and any associated services.{' '}
                <strong>&ldquo;Services&rdquo;</strong> means the challan lookup, settlement
                facilitation and related services offered by ChallanOne.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">2.</span>
              <h2>Acceptance of Terms</h2>
            </header>
            <div className="legal-body">
              <p>
                By accessing or using the Platform, you confirm that you have read, understood
                and agree to be bound by these Terms, our{' '}
                <Link to="/privacy">Privacy Policy</Link> and our{' '}
                <Link to="/refund">Refund Policy</Link>. If you do not agree, you must not use
                the Platform.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">3.</span>
              <h2>Eligibility</h2>
            </header>
            <div className="legal-body">
              <p>You may use the Platform only if:</p>
              <ul>
                <li>You are at least 18 years of age and competent to contract under the Indian Contract Act, 1872.</li>
                <li>You are a resident of India and provide a valid Indian mobile number.</li>
                <li>You are not barred from receiving services under applicable Indian law.</li>
                <li>You are looking up a vehicle you own, operate, or are otherwise authorised to act for.</li>
              </ul>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">4.</span>
              <h2>Nature of Service — Important Disclaimer</h2>
            </header>
            <div className="legal-body">
              <p>
                ChallanOne is an <strong>independent private service</strong>. We are{' '}
                <strong>not</strong> a government portal, RTO, traffic police department, court,
                or any government authority. We use authorised third-party data sources to retrieve
                information about traffic challans and facilitate their settlement on your behalf.
              </p>
              <p>
                All actual settlement of fines is done with the relevant government authority. We
                act as a facilitator, ground team and/or legal representative depending on the
                nature of the challan.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">5.</span>
              <h2>Account, OTP &amp; Authentication</h2>
            </header>
            <div className="legal-body">
              <p>
                Access to the Platform is via a one-time password (OTP) sent to your registered
                mobile number. You are responsible for maintaining the confidentiality of your OTP
                and SIM. You agree to notify us immediately of any unauthorised use of your account.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">6.</span>
              <h2>Vehicle &amp; Personal Information</h2>
            </header>
            <div className="legal-body">
              <p>
                You represent that the vehicle registration number and other details you supply are
                accurate and that you have lawful authority to look up that vehicle. Any liability
                arising from misrepresentation is solely yours.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">7.</span>
              <h2>Service Fees and Payments</h2>
            </header>
            <div className="legal-body">
              <p>
                ChallanOne charges a flat per-challan service fee in addition to the government
                fine. Fees vary by the type of challan and may include state-specific overrides for
                complex matters. The applicable fee for each challan is{' '}
                <strong>displayed on the checkout screen before you pay</strong>, and current
                pricing is published on our website.
              </p>
              <p>
                All payments are processed via Razorpay Software Pvt. Ltd., a payment aggregator
                authorised by the Reserve Bank of India. ChallanOne does not store your card, UPI
                or bank credentials.
              </p>
              <p>Applicable taxes including GST may be charged on the service fee.</p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">8.</span>
              <h2>Settlement Timelines</h2>
            </header>
            <div className="legal-body">
              <p>
                Settlement typically takes 45 – 60 working days from payment, depending on the
                challan type and the relevant RTO or court. Court challans further depend on the
                next listing date and are best-effort. Timelines are estimates and not binding
                guarantees; they may be affected by court schedules, RTO backlogs or government
                office closures.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">9.</span>
              <h2>Refunds</h2>
            </header>
            <div className="legal-body">
              <p>
                Refunds are governed by our{' '}
                <Link to="/refund">Refund Policy</Link>. In summary: if a paid challan cannot be
                settled, the service fee for that challan is refunded to the original payment
                method.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">10.</span>
              <h2>Acceptable Use</h2>
            </header>
            <div className="legal-body">
              <p>You agree not to:</p>
              <ul>
                <li>Look up vehicle information without lawful authority.</li>
                <li>Use the Platform for any unlawful, fraudulent or harmful purpose.</li>
                <li>Attempt to gain unauthorised access to our systems, scrape, or use bots.</li>
                <li>Resell, white-label or commercially exploit the Platform without our written consent.</li>
              </ul>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">11.</span>
              <h2>Intellectual Property</h2>
            </header>
            <div className="legal-body">
              <p>
                The Platform, including its design, text, graphics, logos and software, is owned
                by or licensed to ChallanOne and is protected under applicable Indian and
                international intellectual property laws. You receive a limited, revocable,
                non-exclusive licence to use the Platform for personal, non-commercial purposes
                only.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">12.</span>
              <h2>Third-Party Services</h2>
            </header>
            <div className="legal-body">
              <p>
                The Platform integrates with third-party services including, without limitation:{' '}
                <strong>Razorpay</strong> (payments),{' '}
                <strong>Fast2SMS</strong> (transactional SMS), and authorised challan-data
                providers. Your use of these services is subject to their own terms. ChallanOne is
                not responsible for outages, errors or policy changes on the part of these
                providers.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">13.</span>
              <h2>Indemnification</h2>
            </header>
            <div className="legal-body">
              <p>
                You agree to indemnify and hold harmless ChallanOne, its officers, employees and
                contractors from any claim, loss, damage, liability or expense (including reasonable
                legal fees) arising from your breach of these Terms, your misuse of the Platform,
                or your violation of any applicable law or third-party right.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">14.</span>
              <h2>Limitation of Liability</h2>
            </header>
            <div className="legal-body">
              <p>
                To the maximum extent permitted by Indian law, ChallanOne&apos;s aggregate
                liability arising out of or in connection with your use of the Platform shall not
                exceed the total service fees paid by you in the three (3) months preceding the
                event giving rise to liability. We shall not be liable for any indirect, incidental,
                special, consequential, exemplary or punitive damages.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">15.</span>
              <h2>Force Majeure</h2>
            </header>
            <div className="legal-body">
              <p>
                ChallanOne shall not be liable for any failure to perform due to causes beyond its
                reasonable control, including without limitation acts of God, government action,
                court closures, strikes, internet outages, or natural disasters.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">16.</span>
              <h2>Termination</h2>
            </header>
            <div className="legal-body">
              <p>
                We may suspend or terminate your access to the Platform at any time, with or
                without notice, if we reasonably believe you have breached these Terms or
                applicable law. Provisions relating to indemnity, limitation of liability,
                governing law and jurisdiction shall survive termination.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">17.</span>
              <h2>Governing Law and Jurisdiction</h2>
            </header>
            <div className="legal-body">
              <p>
                These Terms are governed by and construed in accordance with the laws of India.
                Subject to Clause 18 (Dispute Resolution), the courts at{' '}
                <strong>New Delhi, India</strong> shall have exclusive jurisdiction over any
                dispute arising out of or in connection with these Terms.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">18.</span>
              <h2>Dispute Resolution</h2>
            </header>
            <div className="legal-body">
              <p>
                Any dispute, controversy or claim arising out of or in connection with these Terms
                shall first be attempted to be resolved amicably through good-faith negotiations.
                Failing that, the dispute shall be referred to arbitration by a sole arbitrator
                under the <strong>Arbitration and Conciliation Act, 1996</strong>. The seat and
                venue of arbitration shall be New Delhi, India, and the arbitration shall be
                conducted in English.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">19.</span>
              <h2>Modifications to these Terms</h2>
            </header>
            <div className="legal-body">
              <p>
                We may amend these Terms from time to time. The updated version shall be posted on
                this page along with the &ldquo;Effective&rdquo; date. Continued use of the
                Platform after such posting constitutes your acceptance of the revised Terms.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">20.</span>
              <h2>Contact</h2>
            </header>
            <div className="legal-body">
              <p>
                For any questions on these Terms, write to{' '}
                <a href="mailto:challanone1111@gmail.com">challanone1111@gmail.com</a> or see our{' '}
                <Link to="/support">Contact page</Link>.
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  )
}
