<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Smart Eco Bank API is running',
        'status' => 'success'
    ]);
});