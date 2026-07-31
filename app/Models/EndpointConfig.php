<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EndpointConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'operator',
        'operator_name',
        'id_service',
        'service_name',
        'date_mode',
        'target_date',
        'last_run_at',
        'status',
    ];
    
    protected $casts = [
        'target_date' => 'date',
        'last_run_at' => 'datetime',
    ];
}
