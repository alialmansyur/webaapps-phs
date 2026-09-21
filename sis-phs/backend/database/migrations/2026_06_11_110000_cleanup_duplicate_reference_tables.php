<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            UPDATE users u
            LEFT JOIN reg_districts rd ON rd.id = u.district_id
            SET u.district_id = NULL
            WHERE u.district_id IS NOT NULL AND rd.id IS NULL
        ");

        DB::statement("
            UPDATE users u
            LEFT JOIN reg_villages rv ON rv.id = u.village_id
            SET u.village_id = NULL
            WHERE u.village_id IS NOT NULL AND rv.id IS NULL
        ");

        DB::statement("
            UPDATE user_scopes us
            LEFT JOIN reg_districts rd ON rd.id = us.district_id
            SET us.district_id = NULL
            WHERE us.district_id IS NOT NULL AND rd.id IS NULL
        ");

        DB::statement("
            UPDATE user_scopes us
            LEFT JOIN reg_villages rv ON rv.id = us.village_id
            SET us.village_id = NULL
            WHERE us.village_id IS NOT NULL AND rv.id IS NULL
        ");

        $invalidPuskesmasIds = DB::table('puskesmas as p')
            ->leftJoin('reg_districts as rd', 'rd.id', '=', 'p.district_id')
            ->whereNull('rd.id')
            ->pluck('p.id');

        if ($invalidPuskesmasIds->isNotEmpty()) {
            DB::table('dinkes_puskesmas')->whereIn('puskesmas_id', $invalidPuskesmasIds)->delete();
            DB::table('puskesmas_villages')->whereIn('puskesmas_id', $invalidPuskesmasIds)->delete();
            DB::table('users')->whereIn('puskesmas_id', $invalidPuskesmasIds)->update(['puskesmas_id' => null]);
            DB::table('user_scopes')->whereIn('puskesmas_id', $invalidPuskesmasIds)->update(['puskesmas_id' => null]);
            DB::table('puskesmas')->whereIn('id', $invalidPuskesmasIds)->delete();
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['village_id']);
        });

        Schema::table('user_scopes', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['village_id']);
        });

        Schema::table('puskesmas', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
        });

        Schema::table('puskesmas_villages', function (Blueprint $table) {
            $table->dropForeign(['village_id']);
        });

        Schema::table('mstr_households', function (Blueprint $table) {
            $table->dropForeign(['village_id']);
        });

        DB::statement("ALTER TABLE users MODIFY district_id CHAR(6) NULL");
        DB::statement("ALTER TABLE users MODIFY village_id CHAR(10) NULL");
        DB::statement("ALTER TABLE user_scopes MODIFY district_id CHAR(6) NULL");
        DB::statement("ALTER TABLE user_scopes MODIFY village_id CHAR(10) NULL");
        DB::statement("ALTER TABLE puskesmas MODIFY district_id CHAR(6) NOT NULL");
        DB::statement("ALTER TABLE puskesmas_villages MODIFY village_id CHAR(10) NOT NULL");
        DB::statement("ALTER TABLE mstr_households MODIFY village_id CHAR(10) NOT NULL");

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('reg_districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('user_scopes', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('reg_districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('puskesmas', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('reg_districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::table('puskesmas_villages', function (Blueprint $table) {
            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::table('mstr_households', function (Blueprint $table) {
            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::dropIfExists('villages');
        Schema::dropIfExists('districts');
    }

    public function down(): void
    {
        Schema::create('districts', function (Blueprint $table) {
            $table->char('id', 6)->primary();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->char('id', 10)->primary();
            $table->char('district_id', 6);
            $table->string('name');
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        DB::statement("
            INSERT INTO districts (id, name, created_at, updated_at)
            SELECT id, name, NOW(), NOW() FROM reg_districts
            ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = VALUES(updated_at)
        ");

        DB::statement("
            INSERT INTO villages (id, district_id, name, created_at, updated_at)
            SELECT id, district_id, name, NOW(), NOW() FROM reg_villages
            ON DUPLICATE KEY UPDATE district_id = VALUES(district_id), name = VALUES(name), updated_at = VALUES(updated_at)
        ");

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['village_id']);
        });

        Schema::table('user_scopes', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['village_id']);
        });

        Schema::table('puskesmas', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
        });

        Schema::table('puskesmas_villages', function (Blueprint $table) {
            $table->dropForeign(['village_id']);
        });

        Schema::table('mstr_households', function (Blueprint $table) {
            $table->dropForeign(['village_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('user_scopes', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('puskesmas', function (Blueprint $table) {
            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::table('puskesmas_villages', function (Blueprint $table) {
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::table('mstr_households', function (Blueprint $table) {
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->restrictOnDelete();
        });
    }
};
