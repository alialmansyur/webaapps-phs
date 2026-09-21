<?php
$req = Illuminate\Http\Request::create('/api/admin/reports/phs-kabupaten', 'GET', ['page' => 1, 'perPage' => 5]);
$controller = app()->make(App\Http\Controllers\AdminReportPhsKabupatenController::class);
$response = $controller->index($req);
echo json_encode($response->getData());
