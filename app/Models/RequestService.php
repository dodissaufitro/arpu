<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestService extends Model
{
    protected $fillable = [
        'operator',
        'service',
        'keyword',
        'price',
        'negara',
        'sdc',
        'url_wap',
        'status',
    ];
}
