<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GuestCustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Customer::firstOrCreate(
            ['id' => 1],
            [
                'name'      => 'Guest',
                'phone'     => '000000000000',
                'saldo'     => 0
            ]
        );
    }
}
