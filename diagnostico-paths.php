<?php
// BORRAR ESTE ARCHIVO DESPUÉS DE USARLO
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');

$paths = [
    '/data2/html/erpdistribucion/images/prospectos',
    '/var/www/html/erpdistribucion/images/prospectos',
    '/var/www/html/prospectos/images',
    '/data2/html/erpdistribucion/images',
    '/data2/html',
    '/var/www/html/erpdistribucion',
];

echo "=== DIAGNÓSTICO PATHS ===\n\n";
echo "DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'n/a') . "\n";
echo "SCRIPT: " . __FILE__ . "\n";
echo "PHP user: " . trim(shell_exec('whoami') ?: 'desconocido') . "\n\n";

foreach ($paths as $p) {
    $existe   = is_dir($p)      ? 'SI' : 'NO';
    $escribe  = is_writable($p) ? 'SI' : 'NO';
    echo "$p\n  existe=$existe  writable=$escribe\n";
}

echo "\n=== INTENTAR CREAR /data2/html/erpdistribucion/images/prospectos ===\n";
$r = @mkdir('/data2/html/erpdistribucion/images/prospectos', 0775, true);
echo "mkdir resultado: " . ($r ? 'OK' : 'FALLO') . "\n";
echo "writable ahora: " . (is_writable('/data2/html/erpdistribucion/images/prospectos') ? 'SI' : 'NO') . "\n";

echo "\n=== INTENTAR CREAR /var/www/html/erpdistribucion/images/prospectos ===\n";
$r2 = @mkdir('/var/www/html/erpdistribucion/images/prospectos', 0775, true);
echo "mkdir resultado: " . ($r2 ? 'OK' : 'FALLO') . "\n";
echo "writable ahora: " . (is_writable('/var/www/html/erpdistribucion/images/prospectos') ? 'SI' : 'NO') . "\n";
