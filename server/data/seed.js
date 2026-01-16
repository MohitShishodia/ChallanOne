// Database seeding script for Supabase
// Run with: node data/seed.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Sample vehicles data
const vehicles = [
    {
        vehicle_number: 'MH-12-AB-1234',
        vehicle_type: 'Car',
        model: 'MARUTI VITARA BREZZA LDI (O)',
        manufacturer: 'MARUTI SUZUKI',
        owner_name: 'Rahul Kumar',
        registration_date: '2020-01-15',
        insurance_expiry: '2024-12-18',
        insurance_status: 'expired',
        rc_status: 'ACTIVE',
        fuel_type: 'DIESEL',
        color: 'PEARL ARCTIC WHITE',
        chassis_number: 'MA3EJKD1S00123456',
        engine_number: 'D13A-1234567',
        image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=100&h=60&fit=crop'
    },
    {
        vehicle_number: 'KA-01-MJ-2023',
        vehicle_type: 'Car',
        model: 'HYUNDAI CRETA SX (O)',
        manufacturer: 'HYUNDAI',
        owner_name: 'Amit Singh',
        registration_date: '2021-03-10',
        insurance_expiry: '2025-02-25',
        insurance_status: 'active',
        rc_status: 'ACTIVE',
        fuel_type: 'PETROL',
        color: 'PHANTOM BLACK',
        chassis_number: 'MALBB51BLHM654321',
        engine_number: 'G4FG-9876543',
        image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=60&fit=crop'
    },
    {
        vehicle_number: 'DL-05-CX-4567',
        vehicle_type: 'Bike',
        model: 'HONDA ACTIVA 6G',
        manufacturer: 'HONDA',
        owner_name: 'Priya Mehta',
        registration_date: '2022-07-05',
        insurance_expiry: '2025-01-15',
        insurance_status: 'expiring_soon',
        rc_status: 'ACTIVE',
        fuel_type: 'PETROL',
        color: 'PEARL SPARTAN RED',
        chassis_number: 'ME4JF50CJLU123456',
        engine_number: 'JF50E-1234567',
        image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=100&h=60&fit=crop'
    }
];

// Challans will be linked to vehicle IDs after vehicles are inserted
const challansData = [
    {
        vehicleNumber: 'MH-12-AB-1234',
        challans: [
            {
                challan_number: 'CH-2023-89210',
                violation_type: 'Overspeeding',
                description: 'Overspeeding (80km/h in 60 zone)',
                amount: 1000,
                status: 'OVERDUE',
                fine_date: '2023-10-12',
                fine_time: '14:30:00',
                location: 'Mumbai-Pune Expressway, km 42',
                proof_image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop',
                issued_by: 'Traffic Police, Pune'
            },
            {
                challan_number: 'CH-2023-99102',
                violation_type: 'Signal Jump',
                description: 'Signal Jump',
                amount: 500,
                status: 'PENDING',
                fine_date: '2023-10-15',
                fine_time: '09:15:00',
                location: 'MG Road Signal, Pune',
                proof_image_url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&h=300&fit=crop',
                issued_by: 'Traffic Police, Pune'
            },
            {
                challan_number: 'CH-2023-11202',
                violation_type: 'No Parking',
                description: 'No Parking Zone',
                amount: 500,
                status: 'PENDING',
                fine_date: '2023-10-18',
                fine_time: '11:00:00',
                location: 'FC Road, Near Starbucks',
                proof_image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop',
                issued_by: 'Traffic Warden, Pune'
            }
        ]
    },
    {
        vehicleNumber: 'KA-01-MJ-2023',
        challans: [
            {
                challan_number: 'CH-2023-45678',
                violation_type: 'Helmet Violation',
                description: 'Riding without helmet',
                amount: 1000,
                status: 'PENDING',
                fine_date: '2023-10-20',
                fine_time: '16:45:00',
                location: 'Brigade Road, Bangalore',
                proof_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                issued_by: 'Traffic Police, Bangalore'
            }
        ]
    },
    {
        vehicleNumber: 'DL-05-CX-4567',
        challans: [
            {
                challan_number: 'CH-2023-98765',
                violation_type: 'Wrong Side Driving',
                description: 'Driving on wrong side of road',
                amount: 2000,
                status: 'OVERDUE',
                fine_date: '2023-10-05',
                fine_time: '08:30:00',
                location: 'Connaught Place, Delhi',
                proof_image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop',
                issued_by: 'Delhi Traffic Police'
            }
        ]
    }
];

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await supabase.from('challans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Cleared existing data\n');

        // Insert vehicles
        console.log('🚗 Inserting vehicles...');
        const { data: insertedVehicles, error: vehicleError } = await supabase
            .from('vehicles')
            .insert(vehicles)
            .select();

        if (vehicleError) {
            throw new Error(`Vehicle insert error: ${vehicleError.message}`);
        }
        console.log(`✅ Inserted ${insertedVehicles.length} vehicles\n`);

        // Create vehicle number to ID map
        const vehicleMap = {};
        insertedVehicles.forEach(v => {
            vehicleMap[v.vehicle_number] = v.id;
        });

        // Insert challans
        console.log('📋 Inserting challans...');
        let totalChallans = 0;

        for (const vehicleChallans of challansData) {
            const vehicleId = vehicleMap[vehicleChallans.vehicleNumber];
            if (!vehicleId) {
                console.log(`⚠️  No vehicle found for ${vehicleChallans.vehicleNumber}`);
                continue;
            }

            const challansWithVehicleId = vehicleChallans.challans.map(c => ({
                ...c,
                vehicle_id: vehicleId
            }));

            const { error: challanError } = await supabase
                .from('challans')
                .insert(challansWithVehicleId);

            if (challanError) {
                throw new Error(`Challan insert error: ${challanError.message}`);
            }

            totalChallans += challansWithVehicleId.length;
        }
        console.log(`✅ Inserted ${totalChallans} challans\n`);

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('Test vehicles:');
        console.log('  - MH-12-AB-1234 (3 challans)');
        console.log('  - KA-01-MJ-2023 (1 challan)');
        console.log('  - DL-05-CX-4567 (1 challan)');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seed();
