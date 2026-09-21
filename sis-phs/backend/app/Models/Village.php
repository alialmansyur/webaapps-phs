<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Village extends Model
{
    protected $table = 'reg_villages';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'district_id', 'name', 'att1'];

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function puskesmas(): BelongsToMany
    {
        return $this->belongsToMany(Puskesmas::class, 'puskesmas_villages', 'village_id', 'puskesmas_id')->withTimestamps();
    }

    public function faskes(): BelongsToMany
    {
        return $this->belongsToMany(Faskes::class, 'mstr_faskes_villages', 'village_id', 'faskes_id')->withTimestamps();
    }
}
