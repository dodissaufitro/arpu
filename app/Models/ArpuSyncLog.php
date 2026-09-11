<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ArpuSyncLog extends Model
{
    use HasFactory;

    protected $table = 'arpu_sync_logs';

    protected $fillable = [
        'operator',
        'id_service',
        'sync_date',
        'total_inserted',
        'total_updated',
        'status',
        'notes',
    ];
}
