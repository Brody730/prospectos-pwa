<?php
// BORRAR ESTE ARCHIVO DESPUÉS DE USARLO
session_start();
if (!isset($_SESSION['UserID'])) {
    die(json_encode(['error' => 'No autorizado']));
}
header('Content-Type: application/json');

$candidatos = [
    '/data2/html/erpdistribucion/images/prospectos',
    '/var/www/html/erpdistribucion/images/prospectos',
    '/var/www/html/prospectos/images/prospectos',
];

$info = [];
foreach ($candidatos as $path) {
    $info[$path] = [
        'exists'    => is_dir($path),
        'writable'  => is_writable($path),
        'can_mkdir' => !is_dir($path) ? @mkdir($path, 0775, true) : null,
    ];
    // re-check after mkdir attempt
    $info[$path]['exists_after']   = is_dir($path);
    $info[$path]['writable_after'] = is_writable($path);
}

// Also show __FILE__ context and who we run as
$info['__context'] = [
    'script_dir'  => __DIR__,
    'php_user'    => function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : get_current_user(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'n/a',
    'erp_images_via_scandir' => @scandir('/data2/html/erpdistribucion/images') ?: 'no acceso',
    'var_www_erp_images' => @scandir('/var/www/html/erpdistribucion/images') ?: 'no acceso',
];

echo json_encode($info, JSON_PRETTY_PRINT);
