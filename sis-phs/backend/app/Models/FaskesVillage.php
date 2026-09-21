<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaskesVillage extends Model
{
    protected $table = 'mstr_faskes_villages';

    protected $fillable = ['faskes_id', 'village_id'];
}
