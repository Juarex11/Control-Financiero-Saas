<?php

namespace App\Helpers;

class TimezoneHelper
{
    protected static array $paisTimezone = [
        'Perú'        => 'America/Lima',
        'Peru'        => 'America/Lima',
        'Bolivia'     => 'America/La_Paz',
        'Costa Rica'  => 'America/Costa_Rica',
        'Colombia'    => 'America/Bogota',
        'México'      => 'America/Mexico_City',
        'Mexico'      => 'America/Mexico_City',
        'Argentina'   => 'America/Argentina/Buenos_Aires',
        'Chile'       => 'America/Santiago',
        'Ecuador'     => 'America/Guayaquil',
        'Guatemala'   => 'America/Guatemala',
        'Honduras'    => 'America/Tegucigalpa',
        'Nicaragua'   => 'America/Managua',
        'Paraguay'    => 'America/Asuncion',
        'República Dominicana' => 'America/Santo_Domingo',
        'Uruguay'     => 'America/Montevideo',
        'Venezuela'   => 'America/Caracas',
        'Estados Unidos' => 'America/New_York',
        'España'      => 'Europe/Madrid',
    ];

    public static function resolve(?string $timezone, ?string $pais): string
    {
        if ($timezone) {
            return $timezone;
        }

        if ($pais && isset(self::$paisTimezone[$pais])) {
            return self::$paisTimezone[$pais];
        }

        return 'America/Lima';
    }
}