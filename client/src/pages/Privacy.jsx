import { Link } from 'react-router-dom'
import './Legal.css'

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        {/* Header */}
        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-effective">Effective 17 August 2026</p>
          <p className="legal-lead">
            This Privacy Policy explains what personal data ChallanOne collects from you, why we
            collect it, how we use it, and the rights you have over it. We process personal data
            in line with the Information Technology Act, 2000, the Digital Personal Data Protection
            Act, 2023 (DPDP Act) and other applicable Indian law.
          </p>
        </div>

        {/* Sections */}
        <article className="legal-article">

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">1.</span>
              <h2>Who we are</h2>
            </header>
            <div className="legal-body">
              <p>
                ChallanOne is an independent Indian service that helps users look up and settle
                traffic challans on their vehicles. For the purpose of the DPDP Act, ChallanOne
                is the <strong>Data Fiduciary</strong> for the personal data described in this Policy.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">2.</span>
              <h2>Information we collect</h2>
            </header>
            <div className="legal-body">
              <p>We collect the following categories of personal data:</p>
              <ul>
                <li><strong>Identity &amp; contact:</strong> mobile number, name (if provided), email (if provided).</li>
                <li><strong>Vehicle information:</strong> registration number (RC), challan numbers and related data returned by authorised challan databases.</li>
                <li><strong>Payment information:</strong> handled by Razorpay; we receive the payment ID, order ID, amount, and status, but <strong>not</strong> your card / UPI / netbanking credentials.</li>
                <li><strong>Technical information:</strong> IP address, browser type, device type, OS, time-stamps, and pages visited.</li>
                <li><strong>Communication records:</strong> any messages you send to our support, grievance or business teams.</li>
              </ul>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">3.</span>
              <h2>How we use your information</h2>
            </header>
            <div className="legal-body">
              <p>We use your personal data to:</p>
              <ul>
                <li>Provide and operate the Services (lookup, payment, settlement).</li>
                <li>Authenticate you via OTP and maintain your session.</li>
                <li>Communicate with you about your cases, including SMS updates.</li>
                <li>Process payments through our payment partner.</li>
                <li>Comply with applicable law and respond to lawful requests.</li>
                <li>Detect, prevent and address fraud, abuse and security incidents.</li>
                <li>Improve and personalise the Platform.</li>
              </ul>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">4.</span>
              <h2>Legal basis for processing</h2>
            </header>
            <div className="legal-body">
              <p>Under the DPDP Act, we process your personal data on the basis of:</p>
              <ul>
                <li><strong>Your consent</strong>, which you give when you submit your phone number, OTP, or vehicle registration.</li>
                <li><strong>Performance of the contract</strong> between you and ChallanOne for the Services you have requested.</li>
                <li><strong>Legitimate uses</strong> recognised under Section 7 of the DPDP Act, including compliance with judgments, prevention of fraud, and responding to public-interest matters.</li>
              </ul>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">5.</span>
              <h2>Sharing of information</h2>
            </header>
            <div className="legal-body">
              <p>We share personal data only with the following categories of recipients:</p>
              <ul>
                <li><strong>Payment processor</strong> — Razorpay Software Pvt. Ltd., for processing your payments.</li>
                <li><strong>SMS / OTP provider</strong> — Fast2SMS, for delivering transactional SMS to you (only when OTP delivery is enabled).</li>
                <li><strong>Authorised challan-data providers</strong> — to look up challan records against your vehicle.</li>
                <li><strong>Government authorities, RTOs and courts</strong> — to settle the challan on your behalf.</li>
                <li><strong>Empanelled lawyers</strong> — for court challans, the advocate representing you may receive case-relevant data.</li>
                <li><strong>Cloud, analytics and security service providers</strong> — operating under contractual confidentiality obligations.</li>
                <li><strong>Any other party</strong> — pursuant to a lawful order, government request, or to enforce our Terms.</li>
              </ul>
              <p>We do <strong>not</strong> sell your personal data to advertisers.</p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">6.</span>
              <h2>Cookies and similar technologies</h2>
            </header>
            <div className="legal-body">
              <p>
                We use essential cookies to maintain your session (e.g. the{' '}
                <code>cs_session</code> cookie used to remember your OTP-verified state). We may
                also use first-party analytics to understand how the Platform is used. You may
                control cookies via your browser settings; disabling essential cookies will impair
                functionality.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">7.</span>
              <h2>Data retention</h2>
            </header>
            <div className="legal-body">
              <p>
                We retain your personal data only for as long as necessary to fulfil the purposes
                for which it was collected, including the duration of the contract, applicable tax
                and accounting record retention requirements (typically 8 years under Indian law),
                and to comply with our legal obligations. After this period, data is anonymised or
                securely deleted.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">8.</span>
              <h2>Data security</h2>
            </header>
            <div className="legal-body">
              <p>
                We maintain reasonable security practices and procedures as required under Rule 8
                of the <strong>Information Technology (Reasonable Security Practices and Procedures
                and Sensitive Personal Data or Information) Rules, 2011</strong>. Measures include
                encryption in transit (HTTPS), secure session tokens, restricted access, and
                periodic review of our security posture. No system is 100% secure; please use the
                Platform with appropriate care.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">9.</span>
              <h2>Your rights under the DPDP Act</h2>
            </header>
            <div className="legal-body">
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate or incomplete data.</li>
                <li>Request erasure of your personal data, subject to legal exceptions.</li>
                <li>Nominate another individual to exercise these rights in the event of your death or incapacity.</li>
                <li>Withdraw your consent at any time. Withdrawing consent will not affect the lawfulness of processing carried out before the withdrawal, and may impair our ability to provide the Services.</li>
                <li>Lodge a grievance — see Section 12 below.</li>
              </ul>
              <p>
                To exercise these rights, write to{' '}
                <a href="mailto:challanone1111@gmail.com">challanone1111@gmail.com</a>. We will
                respond within the statutory timelines.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">10.</span>
              <h2>Children&apos;s privacy</h2>
            </header>
            <div className="legal-body">
              <p>
                The Platform is not intended for use by children under the age of 18. We do not
                knowingly collect personal data from minors. If you believe a minor has provided us
                personal data, please contact us and we will delete it promptly.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">11.</span>
              <h2>Changes to this Policy</h2>
            </header>
            <div className="legal-body">
              <p>
                We may update this Policy from time to time. The updated version will be posted on
                this page with the &ldquo;Effective&rdquo; date. Material changes will be
                communicated through the Platform or via SMS where appropriate.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">12.</span>
              <h2>Grievance Officer</h2>
            </header>
            <div className="legal-body">
              <div className="legal-grievance-box">
                <p className="legal-grievance-title">Grievance Officer</p>
                <p className="legal-grievance-intro">
                  In accordance with the <strong>Information Technology Act, 2000</strong> and the{' '}
                  <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics
                  Code) Rules, 2021</strong>, the Grievance Officer for ChallanOne is:
                </p>
                <dl className="legal-dl">
                  <dt>Designation</dt>
                  <dd>Grievance Officer, ChallanOne</dd>
                  <dt>Email</dt>
                  <dd><a href="mailto:challanone1111@gmail.com">challanone1111@gmail.com</a></dd>
                  <dt>Response</dt>
                  <dd>Acknowledged within 24 hours · resolved within 15 days</dd>
                </dl>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <header className="legal-section-header">
              <span className="legal-num">13.</span>
              <h2>Contact</h2>
            </header>
            <div className="legal-body">
              <p>
                For any privacy questions, write to{' '}
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
