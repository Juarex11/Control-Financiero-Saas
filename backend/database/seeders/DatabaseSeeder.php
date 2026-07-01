<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'             => 'Administrador',
            'email'            => 'admin@controlfinanciero.com',
            'password'         => Hash::make('admin1234'),
            'role'             => 'admin',
            'codigo_acceso'    => User::generarCodigo(),
            'onboarding_done'  => true,
        ]);
    }
}