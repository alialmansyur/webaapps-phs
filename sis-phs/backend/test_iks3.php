<?php
$request = new \Illuminate\Http\Request();
$controller = new \App\Http\Controllers\AdminReportIksController();
$response = $controller->index($request);
echo $response->content();
