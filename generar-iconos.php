<?php
header('Content-Type: application/json');

if (!extension_loaded('gd')) {
    echo json_encode(array(
        'result' => false,
        'msjError' => 'PHP GD no esta disponible en este servidor',
        'fallback' => 'manifest.json ya incluye un icono SVG inline con purpose any'
    ));
    exit;
}

$baseDir = dirname(__FILE__) . '/assets/icons';
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0775, true);
}

function ProspectosCrearIcono($size, $target)
{
    $img = imagecreatetruecolor($size, $size);
    imagesavealpha($img, true);

    $bg = imagecolorallocate($img, 15, 17, 23);
    $blue = imagecolorallocate($img, 79, 142, 247);
    $white = imagecolorallocate($img, 255, 255, 255);

    imagefill($img, 0, 0, $bg);

    $cx = (int)($size / 2);
    $cy = (int)($size / 2);
    $circle = (int)($size * 0.66);
    imagefilledellipse($img, $cx, $cy, $circle, $circle, $blue);

    $stemX = (int)($size * 0.40);
    $stemY = (int)($size * 0.29);
    $stemW = (int)($size * 0.07);
    $stemH = (int)($size * 0.42);
    imagefilledrectangle($img, $stemX, $stemY, $stemX + $stemW, $stemY + $stemH, $white);

    $topX = (int)($size * 0.47);
    $topY = (int)($size * 0.29);
    $topW = (int)($size * 0.12);
    $topH = (int)($size * 0.07);
    imagefilledrectangle($img, $topX, $topY, $topX + $topW, $topY + $topH, $white);

    $midX = (int)($size * 0.47);
    $midY = (int)($size * 0.47);
    $midW = (int)($size * 0.11);
    $midH = (int)($size * 0.07);
    imagefilledrectangle($img, $midX, $midY, $midX + $midW, $midY + $midH, $white);

    $rightX = (int)($size * 0.58);
    $rightY = (int)($size * 0.36);
    $rightW = (int)($size * 0.07);
    $rightH = (int)($size * 0.18);
    imagefilledrectangle($img, $rightX, $rightY, $rightX + $rightW, $rightY + $rightH, $white);

    imagesetthickness($img, max(6, (int)($size * 0.045)));
    imageline(
        $img,
        (int)($size * 0.49),
        (int)($size * 0.56),
        (int)($size * 0.63),
        (int)($size * 0.71),
        $white
    );

    imagepng($img, $target);
    imagedestroy($img);
}

$targets = array(
    array('size' => 192, 'file' => $baseDir . '/icon-192.png'),
    array('size' => 512, 'file' => $baseDir . '/icon-512.png')
);

$created = array();
foreach ($targets as $target) {
    ProspectosCrearIcono($target['size'], $target['file']);
    $created[] = basename($target['file']);
}

echo json_encode(array(
    'result' => true,
    'creados' => $created,
    'ruta' => 'assets/icons/'
));
?>
