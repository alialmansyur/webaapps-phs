<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faskes extends Model
{
    protected $table = 'mstr_faskes';

    protected $fillable = [
        'code',
        'name',
        'type',
        'district_id',
        'district_name',
        'regency_name',
        'village_focus',
        'address',
        'phone',
        'is_active',
        'cadre_count',
        'household_coverage',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'cadre_count' => 'integer',
        'household_coverage' => 'integer',
    ];

    public function villages()
    {
        return $this->belongsToMany(\App\Models\Village::class, 'mstr_faskes_villages', 'faskes_id', 'village_id')->withTimestamps();
    }

    public function kaders()
    {
        return $this->hasMany(\App\Models\User::class, 'puskesmas_id')->whereHas('role', function($q) {
            $q->where('code', 'kader');
        });
    }
}
