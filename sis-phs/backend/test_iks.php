<?php
$request = new \Illuminate\Http\Request();
$controller = new \App\Http\Controllers\AdminReportIksController();
$response = $controller->options($request);
echo $response->content();
