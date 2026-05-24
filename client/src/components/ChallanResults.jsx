import { useMemo } from 'react'
import { sumChallanFineAmounts } from '../utils/challanUtils'
import { downloadChallansPdf } from '../utils/challanPdf'

export default function ChallanResults({
  data,
  dataSource,
  selectedChallans,
  onToggleChallan,
  onSelectAllPending,
  onDeselectAll,
  onPay,
  onBack,
  paymentLoading
}) {
  const pendingChallans = useMemo(
    () => data.challans.filter((c) => c.status !== 'PAID'),
    [data.challans]
  );

  const paidChallans = useMemo(
    () => data.challans.filter((c) => c.status === 'PAID'),
    [data.challans]
  );

  const selectedPending = pendingChallans.filter((c) => selectedChallans.includes(c.id));
  const allPendingSelected =
    pendingChallans.length > 0 && selectedPending.length === pendingChallans.length;

  const totalDue = sumChallanFineAmounts(pendingChallans);
  const selectedTotal = sumChallanFineAmounts(selectedPending);

  const handleDownloadPdf = () => {
    downloadChallansPdf(data.vehicle, data.challans);
  };

  return (
    <div className="space-y-5">
      {dataSource === 'DELHI_OTP' && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
          <div className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="text-[12px] font-medium text-orange-700">Delhi OTP Verified</span>
        </div>
      )}

      {/* Summary + actions */}
      <div className="surface-card p-5 space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-bold text-slate-900">
                {data.challans.length} Challan{data.challans.length !== 1 ? 's' : ''} Found
              </p>
              <p className="text-[13px] text-slate-600 mt-0.5">
                {pendingChallans.length} pending
                {paidChallans.length > 0 && ` · ${paidChallans.length} paid`}
              </p>
              {pendingChallans.length > 0 && (
                <p className="text-[14px] text-slate-600 mt-1">
                  Total Amount Due:{' '}
                  <span className="font-semibold text-slate-900">₹ {totalDue.toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn-secondary shrink-0 w-full sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All (PDF)
          </button>
        </div>

        {pendingChallans.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onSelectAllPending}
              disabled={allPendingSelected}
              className="text-[13px] font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={selectedPending.length === 0}
              className="text-[13px] font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
            >
              Deselect all
            </button>
            {selectedPending.length > 0 && (
              <span className="text-[12px] text-slate-500 ml-auto">
                {selectedPending.length} selected · ₹ {selectedTotal.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Challan cards */}
      <div className="space-y-4">
        {data.challans.map((challan) => {
          const isPaid = challan.status === 'PAID';
          const isSelected = selectedChallans.includes(challan.id);

          return (
            <div
              key={`${challan.id}-${challan.challanNumber || ''}`}
              className={`surface-card p-5 space-y-4 animate-fade-up transition-colors ${
                !isPaid && isSelected ? 'ring-2 ring-blue-200 border-blue-200' : ''
              } ${isPaid ? 'opacity-90' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!isPaid && (
                  <label className="flex items-center pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleChallan(challan.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select challan ${challan.noticeId || challan.id}`}
                    />
                  </label>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Notice ID</p>
                      <p className="text-[16px] font-bold text-slate-900 break-all">
                        {challan.noticeId || challan.id}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          challan.isCourtChallan
                            ? 'bg-amber-100 text-amber-700'
                            : challan.displayType === 'Physical Challan'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {challan.displayType}
                      </span>
                      <span className={`pill ${isPaid ? 'pill-success' : 'pill-pending'}`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Date</p>
                      <p className="text-[14px] font-semibold text-slate-900">{challan.date}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Time</p>
                      <p className="text-[14px] font-semibold text-slate-900">{challan.time || '00:00'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Fine Amount</p>
                      <p className="text-[14px] font-semibold text-slate-900">
                        ₹ {challan.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[11px] font-medium text-slate-500">Location</p>
                      <p className="text-[14px] font-semibold text-slate-900">{challan.location}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500 mb-1">Offence Details</p>
                    <p className="text-[14px] text-slate-800 leading-snug">{challan.offenceDetails || 'N/A'}</p>
                    {challan.section && (
                      <p className="text-[12px] text-slate-500 mt-1">Section: {challan.section}</p>
                    )}
                  </div>

                  {(challan.isCourtChallan || challan.courtName || challan.courtAddress) && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-[11px] font-semibold text-amber-800 mb-2">Court Details</p>
                      {challan.courtName && (
                        <div className="mb-2">
                          <p className="text-[11px] font-medium text-amber-700/80">Court Name</p>
                          <p className="text-[14px] text-amber-900">{challan.courtName}</p>
                        </div>
                      )}
                      {challan.courtAddress && (
                        <div>
                          <p className="text-[11px] font-medium text-amber-700/80">Court Address</p>
                          <p className="text-[14px] text-amber-900 leading-snug">{challan.courtAddress}</p>
                        </div>
                      )}
                      {challan.sentToRegCourt && (
                        <p className="text-[12px] text-amber-700 mt-2">Registered with court</p>
                      )}
                    </div>
                  )}

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onPay(challan.id)}
                      disabled={paymentLoading}
                      className="btn-primary w-full md:w-auto mt-4"
                    >
                      {paymentLoading
                        ? 'Processing...'
                        : `Pay ₹${challan.amount.toLocaleString()}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {pendingChallans.length > 0 && (
          <button
            type="button"
            onClick={() => onPay()}
            disabled={paymentLoading || selectedPending.length === 0}
            className="btn-primary flex-1"
          >
            {paymentLoading
              ? 'Processing...'
              : selectedPending.length > 0
                ? `Pay Selected (${selectedPending.length}) · ₹${selectedTotal.toLocaleString()}`
                : 'Select challans to pay'}
          </button>
        )}
        <button type="button" onClick={onBack} className="btn-ghost flex-1 sm:flex-initial">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          New Search
        </button>
      </div>

      <p className="text-center text-[12px] text-slate-400 pt-2 pb-4">
        Powered by <span className="font-semibold text-slate-600">Challan One</span>
      </p>
    </div>
  );
}
