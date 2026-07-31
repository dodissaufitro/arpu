<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'permissions'];

    protected $casts = [
        'permissions' => 'array',
    ];

    /**
     * Define the available permissions in the system.
     */
    public static function getAvailablePermissions()
    {
        return [
            'User Management' => [
                'users.view' => 'View Users',
                'users.create' => 'Create Users',
                'users.edit' => 'Edit Users',
                'users.delete' => 'Delete Users',
            ],
            'Role Management' => [
                'roles.view' => 'View Roles',
                'roles.create' => 'Create Roles',
                'roles.edit' => 'Edit Roles',
                'roles.delete' => 'Delete Roles',
            ],
            'Endpoint Configs' => [
                'endpoints.view' => 'View Configs',
                'endpoints.manage' => 'Manage Configs',
            ],
            'Request Services' => [
                'requests.view' => 'View Requests',
                'requests.create' => 'Create Requests',
                'requests.edit' => 'Edit Requests',
                'requests.delete' => 'Delete Requests',
                'requests.manage' => 'Manage Requests (All)',
            ],
            'Daily Push' => [
                'dailypush.view' => 'View Daily Push',
                'dailypush.manage' => 'Manage Daily Push',
            ],
            'ARPU Subscriptions' => [
                'arpu.view' => 'View ARPU',
                'arpu.manage' => 'Manage ARPU',
            ],
            'API Tokens' => [
                'tokens.view' => 'View Tokens',
                'tokens.manage' => 'Manage Tokens',
            ],
        ];
    }
}
