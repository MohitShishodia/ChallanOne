import { BRAND } from '../constants/brand'

export default function PostPaymentSteps({ orderId }) {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[22px] md:text-[26px] font-bold text-slate-900">Payment Successful</h1>
        <p className="mt-1 text-[14px] text-slate-500">Follow these steps to complete your challan clearance</p>
        {orderId && (
          <p className="mt-2 text-[12px] text-slate-400">
            Order ID <span className="font-semibold text-slate-700">#{orderId}</span>
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        <StepCard
          step={1}
          title={`${BRAND.name} agent will call you`}
          desc="Our agent will call you between 10 AM–8 PM to assist you with challan clearance."
        >
          <PhoneCallMock />
        </StepCard>

        <StepCard
          step={2}
          title="Verify with OTP from Parivahan"
          desc="Share the Parivahan OTP sent to your registered number with our agent."
        >
          <SmsOtpMock />
        </StepCard>
      </div>
    </div>
  )
}

function StepCard({ step, title, desc, children }) {
  return (
    <div className="otp-step-card animate-fade-up">
      <div className="relative z-10 flex flex-col h-full">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/25 text-[13px] font-bold mb-4">
          {step}
        </div>
        <Sparkle className="absolute top-4 left-4 opacity-60" />
        <Sparkle className="absolute top-8 right-6 opacity-40 scale-75" />
        <h2 className="text-[17px] md:text-[18px] font-bold text-center leading-snug">{title}</h2>
        <p className="mt-2 text-[13px] text-center text-white/80 leading-relaxed">{desc}</p>
        <div className="mt-5 flex-1 flex items-end justify-center">{children}</div>
      </div>
    </div>
  )
}

function Sparkle({ className }) {
  return (
    <svg className={`h-4 w-4 text-white/70 ${className}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  )
}

function PhoneCallMock() {
  return (
    <div className="w-full max-w-[220px] rounded-2xl bg-slate-900/90 border border-white/10 p-3 shadow-2xl">
      <div className="rounded-xl bg-slate-800/90 p-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={BRAND.logoSrc} alt="" className="h-6 w-6 rounded-full" />
          <span className="text-[11px] font-semibold">Challan One Agent</span>
        </div>
        <p className="text-[10px] text-white/60">+91 *** *** ****</p>
        <div className="mt-4 flex justify-center gap-6">
          <span className="h-10 w-10 rounded-full bg-rose-500/90 flex items-center justify-center">
            <svg className="h-4 w-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
          <span className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="h-4 w-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

function SmsOtpMock() {
  return (
    <div className="w-full max-w-[220px] rounded-2xl bg-slate-900/90 border border-white/10 p-3 shadow-2xl">
      <div className="rounded-xl bg-slate-800/90 p-3">
        <p className="text-[10px] font-semibold text-emerald-400 mb-2">PARIVAHAN</p>
        <div className="rounded-lg bg-slate-700/80 p-2.5 text-[9px] leading-relaxed text-white/90">
          OTP for getting challan details at eChallan is <strong>123456</strong>. Valid for 5 min. Do not share it with anyone. MORTH
        </div>
      </div>
    </div>
  )
}
