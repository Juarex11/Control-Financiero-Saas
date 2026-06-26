<?php

namespace App\Services;

use App\Models\Category;

class CategorySeeder
{
    private static array $defaults = [
        'expense' => [
            ['name' => 'Alimentación', 'color' => '#ef4444'],
            ['name' => 'Transporte',   'color' => '#f97316'],
            ['name' => 'Salud',        'color' => '#10b981'],
            ['name' => 'Vivienda',     'color' => '#3b82f6'],
            ['name' => 'Educación',    'color' => '#8b5cf6'],
            ['name' => 'Ropa',         'color' => '#ec4899'],
            ['name' => 'Servicios',    'color' => '#06b6d4'],
            ['name' => 'Ocio',         'color' => '#ffbf2f'],
        ],
        'income' => [
            ['name' => 'Salario',      'color' => '#31138b'],
            ['name' => 'Freelance',    'color' => '#ff4d94'],
            ['name' => 'Inversiones',  'color' => '#10b981'],
            ['name' => 'Otros',        'color' => '#64748b'],
        ],
    ];

    public static function crearParaUsuario(int $userId): void
    {
        $orden = 0;
        foreach (self::$defaults as $tipo => $categorias) {
            foreach ($categorias as $cat) {
                Category::create([
                    'user_id'    => $userId,
                    'name'       => $cat['name'],
                    'color'      => $cat['color'],
                    'icon'       => 'tag',
                    'type'       => $tipo,
                    'is_default' => true,
                    'order'      => $orden++,
                ]);
            }
        }
    }
}