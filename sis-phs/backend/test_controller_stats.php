<?php
$req = Illuminate\Http\Request::create('/api/admin/reports/phs-kabupaten/stats', 'GET');
$controller = app()->make(App\Http\Controllers\AdminReportPhsKabupatenController::class);
$response = $controller->stats($req);
echo json_encode($response->getData());
