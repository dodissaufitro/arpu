<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ApiToken;

class VerifyApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Token is missing.'
            ], 401);
        }

        $apiToken = ApiToken::where('token', $token)->where('is_active', true)->first();

        if (!$apiToken) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or inactive token.'
            ], 401);
        }

        // Update last used at
        $apiToken->update(['last_used_at' => now()]);

        return $next($request);
    }
}
