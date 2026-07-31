<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Role;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            abort(404);
        }

        // Bypass permission check for Admin Utama (Superadmin)
        if ($user->role === 'Admin Utama') {
            return $next($request);
        }

        $role = Role::where('name', $user->role)->first();

        if (!$role || !is_array($role->permissions) || !in_array($permission, $role->permissions)) {
            abort(404);
        }

        return $next($request);
    }
}
