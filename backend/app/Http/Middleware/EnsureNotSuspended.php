<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->is_suspended) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang ditangguhkan. Anda tidak dapat melakukan tindakan ini.'
            ], 403);
        }

        return $next($request);
    }
}
