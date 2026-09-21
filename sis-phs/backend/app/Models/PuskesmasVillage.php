<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PuskesmasVillage extends Model
{
    protected $table = 'puskesmas_villages';

    protected $fillable = ['puskesmas_id', 'village_id'];
}
