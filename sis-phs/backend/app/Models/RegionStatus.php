<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegionStatus extends Model
{
    protected $table = 'mstr_region_statuses';

    protected $fillable = ['region_level', 'region_id', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
