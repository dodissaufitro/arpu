<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ArpuSubscription extends Model
{
    use HasFactory;
    public $timestamps = false; // We only have created_at, handled differently or we can just disable Laravel's automatic updated_at. Wait, we have created_at.
    const UPDATED_AT = null;
    
    protected $fillable = [
        'country', 'operator', 'id_operator', 'id_service', 'service', 'keyword', 'source', 'msisdn', 'status',
        'cycle', 'adnet', 'revenue', 'subs_date', 'renewal_date', 'freemium_end_date',
        'unsubs_from', 'unsubs_date', 'service_price', 'currency', 'profile_status',
        'publisher', 'trxid', 'pixel', 'handset', 'browser', 'attempt_charging', 'success_billing'
    ];
}
