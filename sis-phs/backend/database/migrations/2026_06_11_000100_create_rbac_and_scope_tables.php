<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('menus')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('title');
            $table->string('path')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('context_group')->nullable();
            $table->timestamps();
        });

        Schema::create('role_menu', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['role_id', 'menu_id']);
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('puskesmas', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('district_id', 20);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('district_id', 20);
            $table->string('name');
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('puskesmas_villages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('puskesmas_id')->constrained('puskesmas')->cascadeOnDelete();
            $table->string('village_id', 20);
            $table->timestamps();

            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->restrictOnDelete();
            $table->unique(['puskesmas_id', 'village_id']);
        });

        Schema::create('dinkes_puskesmas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dinkes_user_id');
            $table->foreignId('puskesmas_id')->constrained('puskesmas')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['dinkes_user_id', 'puskesmas_id']);
        });

        Schema::create('user_scopes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('scope_type');
            $table->string('district_id', 20)->nullable();
            $table->foreignId('puskesmas_id')->nullable()->constrained('puskesmas')->nullOnDelete();
            $table->string('village_id', 20)->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->json('metadata')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
            $table->foreign('district_id')->references('id')->on('districts')->cascadeOnUpdate()->nullOnDelete();
            $table->foreign('puskesmas_id')->references('id')->on('puskesmas')->nullOnDelete();
            $table->foreign('village_id')->references('id')->on('villages')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('dinkes_puskesmas', function (Blueprint $table) {
            $table->foreign('dinkes_user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('dinkes_puskesmas', function (Blueprint $table) {
            $table->dropForeign(['dinkes_user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['district_id']);
            $table->dropForeign(['puskesmas_id']);
            $table->dropForeign(['village_id']);
        });

        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('user_scopes');
        Schema::dropIfExists('dinkes_puskesmas');
        Schema::dropIfExists('puskesmas_villages');
        Schema::dropIfExists('villages');
        Schema::dropIfExists('puskesmas');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('role_menu');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('role_permission');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
