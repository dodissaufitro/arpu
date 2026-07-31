<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ApiToken;
use Illuminate\Support\Str;

class ApiTokenController extends Controller
{
    public function index()
    {
        $tokens = ApiToken::latest()->paginate(10);
        return Inertia::render('api_tokens/index', [
            'tokens' => $tokens
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
        ]);

        ApiToken::create([
            'client_name' => $request->client_name,
            'token' => Str::random(60), // Generate a random 60 char token
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'API Token created successfully.');
    }

    public function update(Request $request, ApiToken $apiToken)
    {
        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $apiToken->update([
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with('success', 'Token status updated.');
    }
}
