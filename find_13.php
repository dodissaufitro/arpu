<?php
$json = file_get_contents('http://149.129.252.221/app/filetest/send_arpu_subs.php?operator=162&id_service=1955&date=2026-07-07');
$data = json_decode($json, true)['data'];
$seen = [];
$updated = [];
foreach ($data as $sub) {
    $key = $sub['msisdn'] . '_' . $sub['id_service'] . '_' . $sub['id_operator'];
    if (isset($seen[$key])) {
        $updated[] = [
            'msisdn' => $sub['msisdn'],
            'id_operator' => $sub['id_operator'],
            'id_service' => $sub['id_service'],
            'status_api' => $sub['status'],
            'renewal_date' => $sub['renewal_date'] ?? null,
            'unsubs_date' => $sub['unsubs_date'] ?? null,
        ];
    } else {
        if ($sub['status'] == 1) {
            $seen[$key] = true;
        }
    }
}
echo json_encode($updated, JSON_PRETTY_PRINT);

