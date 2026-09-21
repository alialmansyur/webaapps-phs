<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Closure;
use Exception;

class CacheBooster
{
    /**
     * Get value from cache or execute callback and cache it.
     * Implements fallback/auto-bypass on failure/corruption.
     *
     * @param string $key
     * @param int|null $ttl TTL in seconds (or null for default)
     * @param Closure $callback
     * @param bool $forceRefresh
     * @return mixed
     */
    public static function remember(string $key, $ttl, Closure $callback, bool $forceRefresh = false)
    {
        if ($forceRefresh) {
            Cache::forget($key);
        }

        try {
            return Cache::remember($key, $ttl, function () use ($callback, $key) {
                return $callback();
            });
        } catch (Exception $e) {
            // Cache service failed (corrupt, uncontactable, etc.)
            // Auto bypass cache and execute callback
            Log::warning("CacheBooster: Failed to read/write cache for key {$key}. Bypassing cache. Error: " . $e->getMessage());
            
            try {
                return $callback();
            } catch (Exception $cbEx) {
                Log::error("CacheBooster: Callback also failed for key {$key}. Error: " . $cbEx->getMessage());
                throw $cbEx;
            }
        }
    }

    /**
     * Safely forget a cache key
     *
     * @param string $key
     * @return void
     */
    public static function forget(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (Exception $e) {
            Log::warning("CacheBooster: Failed to forget cache for key {$key}. Error: " . $e->getMessage());
        }
    }

    /**
     * Get the current cache version for a specific scope
     */
    public static function getVersion(string $scope): string
    {
        try {
            return Cache::rememberForever("cache_version_{$scope}", function () {
                return (string) time();
            });
        } catch (Exception $e) {
            return (string) time(); // Fallback to now if cache fails
        }
    }

    /**
     * Increment/Refresh the cache version for a specific scope, invalidating all keys using it
     */
    public static function refreshVersion(string $scope): void
    {
        try {
            Cache::put("cache_version_{$scope}", (string) time());
        } catch (Exception $e) {
            Log::warning("CacheBooster: Failed to refresh version for scope {$scope}. Error: " . $e->getMessage());
        }
    }
}
