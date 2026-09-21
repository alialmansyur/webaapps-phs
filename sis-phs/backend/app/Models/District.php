<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    protected $table = 'reg_districts';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'regency_id', 'name'];

    public function puskesmas(): HasMany
    {
        return $this->hasMany(Puskesmas::class);
    }

    public function villages(): HasMany
    {
        return $this->hasMany(Village::class);
    }
}
