import VehicleModel from '../models/Vehicle.js';
import ChallanModel from '../models/Challan.js';
import { getNoticeId, resolveChallanStatus } from './challanTransform.js';
import { getOffenceDetails } from './challanFieldHelpers.js';

const DEMO_FILTER = { source: { $ne: 'demo' } };

export { DEMO_FILTER };

function normalizeVehicleNumber(vehicleNumber) {
  return String(vehicleNumber || '').replace(/[\s-]/g, '').toUpperCase();
}

function mapRawToChallanFields(raw, source) {
  const challanNumber = getNoticeId(raw);
  if (!challanNumber || challanNumber === 'N/A') return null;

  const status = resolveChallanStatus(raw);
  const dateSource = raw.challanDate || raw.offenceDate || raw.dateTime || raw.date;
  const fineDate = dateSource ? String(dateSource).split('T')[0].split(' ')[0] : null;

  return {
    challan_number: challanNumber,
    violation_type: raw.violationType || raw.challanType || raw.type || 'Traffic Violation',
    description: getOffenceDetails(raw),
    amount: parseFloat(raw.amount || raw.fineAmount || 0) || 0,
    status: status === 'PAID' ? 'PAID' : (raw.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING'),
    fine_date: fineDate,
    fine_time: raw.fineTime || raw.fine_time || null,
    location: raw.challanPlace || raw.location || raw.description || null,
    issued_by: raw.issuedBy || raw.issued_by || (source === 'delhi_otp' ? 'Delhi Traffic Police' : 'External API'),
    source
  };
}

function mapMappedChallanFields(mapped, source = 'external') {
  const challanNumber = mapped.noticeId || mapped.id || mapped.dbId;
  if (!challanNumber || challanNumber === 'N/A') return null;

  return {
    challan_number: String(challanNumber),
    violation_type: mapped.type || mapped.offenceDetails || 'Traffic Violation',
    description: mapped.offenceDetails || mapped.description || 'Traffic Violation',
    amount: parseFloat(mapped.amount || 0) || 0,
    status: mapped.status === 'PAID' ? 'PAID' : 'PENDING',
    fine_date: mapped.date && mapped.date !== 'N/A' ? mapped.date : null,
    fine_time: mapped.time || null,
    location: mapped.location || null,
    issued_by: mapped.issuedBy || source,
    source
  };
}

export async function upsertVehicle(vehicleNumber, { ownerName, vehicleType } = {}) {
  const normalized = normalizeVehicleNumber(vehicleNumber);
  if (!normalized) return null;

  let vehicle = await VehicleModel.findOne({ vehicle_number: normalized });
  if (!vehicle) {
    vehicle = await VehicleModel.create({
      vehicle_number: normalized,
      owner_name: ownerName || 'Unknown',
      vehicle_type: vehicleType || 'Private Vehicle'
    });
  } else if (ownerName && ownerName !== 'Unknown' && ownerName !== 'Owner') {
    vehicle.owner_name = ownerName;
    await vehicle.save();
  }

  return vehicle;
}

export async function syncRawChallans(vehicleNumber, rawChallans, source = 'external') {
  if (!Array.isArray(rawChallans) || rawChallans.length === 0) return [];

  const ownerName =
    rawChallans[0]?.accusedName ||
    rawChallans[0]?.ownerName ||
    'Unknown';

  const vehicle = await upsertVehicle(vehicleNumber, { ownerName });
  if (!vehicle) return [];

  const synced = [];
  for (const raw of rawChallans) {
    const fields = mapRawToChallanFields(raw, source);
    if (!fields) continue;

    const doc = await ChallanModel.findOneAndUpdate(
      { challan_number: fields.challan_number },
      { ...fields, vehicle_id: vehicle._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    synced.push(doc);
  }

  return synced;
}

export async function syncMappedChallans(vehicleNumber, mappedChallans, source = 'external') {
  if (!Array.isArray(mappedChallans) || mappedChallans.length === 0) return [];

  const ownerName = mappedChallans[0]?.accusedName || 'Unknown';
  const vehicle = await upsertVehicle(vehicleNumber, { ownerName });
  if (!vehicle) return [];

  const synced = [];
  for (const mapped of mappedChallans) {
    const fields = mapMappedChallanFields(mapped, source);
    if (!fields) continue;

    const doc = await ChallanModel.findOneAndUpdate(
      { challan_number: fields.challan_number },
      { ...fields, vehicle_id: vehicle._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    synced.push(doc);
  }

  return synced;
}

export async function markChallansPaidByNumbers(challanNumbers) {
  const numbers = (challanNumbers || []).filter(Boolean);
  if (!numbers.length) return;
  await ChallanModel.updateMany(
    { challan_number: { $in: numbers }, source: { $ne: 'demo' } },
    { status: 'PAID' }
  );
}

/** Tag legacy seed records so admin can exclude them. */
export async function migrateDemoChallans() {
  const result = await ChallanModel.updateMany(
    {
      $or: [
        { challan_number: { $regex: /^CH-2023-/ } },
        { source: 'demo' }
      ]
    },
    { $set: { source: 'demo' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[ChallanSync] Tagged ${result.modifiedCount} demo challans`);
  }
}
