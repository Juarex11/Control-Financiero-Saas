<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'          => 'Administrador',
            'email'         => 'admin@control.com',
            'password'      => bcrypt('Admin2024!'),
            'role'          => 'admin',
            'padre_id'      => null,
            'codigo_acceso' => User::generarCodigo(),
            'currency'      => 'PEN',
        ]);
    }
}