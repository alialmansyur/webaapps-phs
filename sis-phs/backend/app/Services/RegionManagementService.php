<?php

namespace App\Services;

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\RegionStatus;
use App\Models\Village;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegionManagementService
{
    private const LEVELS = ['PROVINSI', 'KABUPATEN', 'KECAMATAN', 'DESA'];

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 5), 100));
        $search = trim((string) ($filters['search'] ?? ''));
        $level = trim((string) ($filters['level'] ?? ''));
        $status = trim((string) ($filters['status'] ?? ''));
        $parentId = trim((string) ($filters['parent_id'] ?? ''));
        $nodeType = trim((string) ($filters['node_type'] ?? ''));

        $query = DB::query()
            ->fromSub($this->buildUnionQuery(), 'regions')
            ->when($search !== '', function (QueryBuilder $builder) use ($search): void {
                $builder->where(function (QueryBuilder $scoped) use ($search): void {
                    $scoped->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('parent_name', 'like', "%{$search}%");
                });
            })
            ->when($level !== '', fn (QueryBuilder $builder) => $builder->where('level', $level))
            ->when($status !== '', function (QueryBuilder $builder) use ($status): void {
                $builder->where('is_active', $status === 'active' ? 1 : 0);
            })
            ->when($parentId !== '', fn (QueryBuilder $builder) => $builder->where('parent_id', $parentId))
            ->when($nodeType !== '', function (QueryBuilder $builder) use ($nodeType): void {
                if ($nodeType === 'ROOT') {
                    $builder->where('child_count', '>', 0);
                    return;
                }

                if ($nodeType === 'LEAF') {
                    $builder->where('child_count', 0);
                }
            })
            ->orderBy('code');

        $records = $query->paginate($perPage)->withQueryString();

        return $records->through(fn ($record) => $this->transformRecord((array) $record));
    }

    public function options(?string $level = null): array
    {
        $targetLevel = trim((string) $level);

        return [
            'levels' => [
                ['value' => 'PROVINSI', 'label' => 'Provinsi'],
                ['value' => 'KABUPATEN', 'label' => 'Kabupaten'],
                ['value' => 'KECAMATAN', 'label' => 'Kecamatan'],
                ['value' => 'DESA', 'label' => 'Desa'],
            ],
            'statuses' => [
                ['value' => 'active', 'label' => 'Aktif'],
                ['value' => 'inactive', 'label' => 'Nonaktif'],
            ],
            'nodeTypes' => [
                ['value' => 'ROOT', 'label' => 'Node Induk'],
                ['value' => 'LEAF', 'label' => 'Node Akhir'],
            ],
            'parents' => [],
        ];
    }

    public function detail(string $level, string $regionId): array
    {
        $record = DB::query()
            ->fromSub($this->buildUnionQuery(), 'regions')
            ->where('level', $this->normalizeLevel($level))
            ->where('id', $regionId)
            ->first();

        if (! $record) {
            abort(404);
        }

        $transformed = $this->transformRecord((array) $record);
        $transformed['householdCoverage'] = $this->householdCoverage($transformed['level'], $transformed['id']);
        $transformed['userCoverage'] = $this->userCoverage($transformed['level'], $transformed['id']);

        return $transformed;
    }

    public function store(array $payload): array
    {
        return DB::transaction(function () use ($payload): array {
            $level = $this->normalizeLevel($payload['level']);
            $id = $this->normalizeCode($payload['code'], $level);
            $parentId = $this->normalizeParentId($payload['parent_id'] ?? null);

            $this->validateHierarchy($level, $id, $parentId);

            $model = $this->newModelForLevel($level);

            if ($model::query()->whereKey($id)->exists()) {
                throw ValidationException::withMessages([
                    'code' => ['Kode wilayah sudah terdaftar.'],
                ]);
            }

            $attributes = $this->buildAttributes($level, $id, $payload['name'], $parentId);
            $model::query()->create($attributes);
            $this->persistStatus($level, $id, (bool) ($payload['is_active'] ?? true));

            return $this->detail($level, $id);
        });
    }

    public function update(string $level, string $regionId, array $payload): array
    {
        return DB::transaction(function () use ($level, $regionId, $payload): array {
            $normalizedLevel = $this->normalizeLevel($level);
            $payloadLevel = $this->normalizeLevel($payload['level']);

            if ($normalizedLevel !== $payloadLevel) {
                throw ValidationException::withMessages([
                    'level' => ['Level wilayah tidak dapat diubah dari form ini.'],
                ]);
            }

            $newId = $this->normalizeCode($payload['code'], $normalizedLevel);
            $parentId = $this->normalizeParentId($payload['parent_id'] ?? null);
            $this->validateHierarchy($normalizedLevel, $newId, $parentId);

            $modelClass = $this->modelClassForLevel($normalizedLevel);
            $record = $modelClass::query()->find($regionId);

            if (! $record) {
                abort(404);
            }

            if ($newId !== $regionId && $modelClass::query()->whereKey($newId)->exists()) {
                throw ValidationException::withMessages([
                    'code' => ['Kode wilayah sudah terdaftar.'],
                ]);
            }

            $record->fill($this->buildAttributes($normalizedLevel, $newId, $payload['name'], $parentId));
            $record->save();

            if ($newId !== $regionId) {
                RegionStatus::query()
                    ->where('region_level', $normalizedLevel)
                    ->where('region_id', $regionId)
                    ->update(['region_id' => $newId]);
            }

            $this->persistStatus($normalizedLevel, $newId, (bool) ($payload['is_active'] ?? true));

            return $this->detail($normalizedLevel, $newId);
        });
    }

    public function import(UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);

        if ($rows->isEmpty()) {
            throw ValidationException::withMessages([
                'file' => ['File import kosong atau tidak memiliki baris data yang valid.'],
            ]);
        }

        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($rows, &$created, &$updated): void {
            foreach ($rows as $index => $row) {
                $level = $this->normalizeLevel((string) ($row['level'] ?? ''));
                $id = $this->normalizeCode((string) ($row['code'] ?? $row['id'] ?? ''), $level);
                $name = trim((string) ($row['name'] ?? ''));
                $parentId = $this->normalizeParentId($row['parent_id'] ?? null);
                $isActive = $this->parseBoolean($row['status'] ?? $row['is_active'] ?? true);

                if ($name === '') {
                    throw ValidationException::withMessages([
                        'file' => ["Baris import ke-" . ($index + 2) . " tidak memiliki nama wilayah."],
                    ]);
                }

                $this->validateHierarchy($level, $id, $parentId);

                $modelClass = $this->modelClassForLevel($level);
                $record = $modelClass::query()->find($id);
                $attributes = $this->buildAttributes($level, $id, $name, $parentId);

                if ($record) {
                    $record->fill($attributes);
                    $record->save();
                    $updated++;
                } else {
                    $modelClass::query()->create($attributes);
                    $created++;
                }

                $this->persistStatus($level, $id, $isActive);
            }
        });

        return [
            'created' => $created,
            'updated' => $updated,
            'total' => $rows->count(),
        ];
    }

    public function destroy(string $level, string $regionId): void
    {
        DB::transaction(function () use ($level, $regionId): void {
            $normalizedLevel = $this->normalizeLevel($level);
            $modelClass = $this->modelClassForLevel($normalizedLevel);
            $record = $modelClass::query()->find($regionId);

            if (! $record) {
                abort(404);
            }

            $detail = $this->detail($normalizedLevel, $regionId);

            if ($detail['childCount'] > 0) {
                throw ValidationException::withMessages([
                    'region' => ['Wilayah tidak dapat dihapus karena memiliki sub-wilayah.'],
                ]);
            }

            if ($detail['puskesmasCoverage'] > 0) {
                throw ValidationException::withMessages([
                    'region' => ['Wilayah tidak dapat dihapus karena terhubung dengan puskesmas.'],
                ]);
            }

            if ($detail['householdCoverage'] > 0) {
                throw ValidationException::withMessages([
                    'region' => ['Wilayah tidak dapat dihapus karena terhubung dengan data rumah tangga.'],
                ]);
            }

            if ($detail['userCoverage'] > 0) {
                throw ValidationException::withMessages([
                    'region' => ['Wilayah tidak dapat dihapus karena digunakan oleh pengguna sistem.'],
                ]);
            }

            $record->delete();
            RegionStatus::query()
                ->where('region_level', $normalizedLevel)
                ->where('region_id', $regionId)
                ->delete();
        });
    }

    private function buildUnionQuery(): QueryBuilder
    {
        $provinceStatusJoin = $this->regionStatusJoin('PROVINSI', 'province.id');
        $regencyStatusJoin = $this->regionStatusJoin('KABUPATEN', 'regency.id');
        $districtStatusJoin = $this->regionStatusJoin('KECAMATAN', 'district.id');
        $villageStatusJoin = $this->regionStatusJoin('DESA', 'village.id');

        $provinceQuery = DB::table('reg_provinces as province')
            ->leftJoin('mstr_region_statuses as status', $provinceStatusJoin)
            ->selectRaw("
                province.id as id,
                province.id as code,
                'PROVINSI' as level,
                province.name as name,
                NULL as parent_id,
                '-' as parent_name,
                (SELECT COUNT(*) FROM reg_regencies regency_child WHERE regency_child.province_id = province.id) as child_count,
                (
                    SELECT COUNT(*)
                    FROM mstr_faskes f
                    INNER JOIN reg_districts d ON d.id = f.district_id
                    INNER JOIN reg_regencies r ON r.id = d.regency_id
                    WHERE r.province_id = province.id AND f.is_active = 1 AND f.type = 'PUSKESMAS'
                ) as puskesmas_coverage,
                COALESCE(status.is_active, 1) as is_active
            ");

        $regencyQuery = DB::table('reg_regencies as regency')
            ->join('reg_provinces as province', 'province.id', '=', 'regency.province_id')
            ->leftJoin('mstr_region_statuses as status', $regencyStatusJoin)
            ->selectRaw("
                regency.id as id,
                CONCAT(SUBSTRING(regency.id, 1, 2), '.', SUBSTRING(regency.id, 3, 2)) as code,
                'KABUPATEN' as level,
                regency.name as name,
                province.id as parent_id,
                province.name as parent_name,
                (SELECT COUNT(*) FROM reg_districts district_child WHERE district_child.regency_id = regency.id) as child_count,
                (
                    SELECT COUNT(*)
                    FROM mstr_faskes f
                    INNER JOIN reg_districts d ON d.id = f.district_id
                    WHERE d.regency_id = regency.id AND f.is_active = 1 AND f.type = 'PUSKESMAS'
                ) as puskesmas_coverage,
                COALESCE(status.is_active, 1) as is_active
            ");

        $districtQuery = DB::table('reg_districts as district')
            ->join('reg_regencies as regency', 'regency.id', '=', 'district.regency_id')
            ->leftJoin('mstr_region_statuses as status', $districtStatusJoin)
            ->selectRaw("
                district.id as id,
                CONCAT(SUBSTRING(district.id, 1, 2), '.', SUBSTRING(district.id, 3, 2), '.', SUBSTRING(district.id, 5, 2)) as code,
                'KECAMATAN' as level,
                district.name as name,
                regency.id as parent_id,
                regency.name as parent_name,
                (SELECT COUNT(*) FROM reg_villages village_child WHERE village_child.district_id = district.id) as child_count,
                (
                    SELECT COUNT(*)
                    FROM mstr_faskes f
                    WHERE f.district_id = district.id AND f.is_active = 1 AND f.type = 'PUSKESMAS'
                ) as puskesmas_coverage,
                COALESCE(status.is_active, 1) as is_active
            ");

        return DB::table('reg_villages as village')
            ->join('reg_districts as district', 'district.id', '=', 'village.district_id')
            ->leftJoin('mstr_region_statuses as status', $villageStatusJoin)
            ->selectRaw("
                village.id as id,
                CONCAT(SUBSTRING(village.id, 1, 2), '.', SUBSTRING(village.id, 3, 2), '.', SUBSTRING(village.id, 5, 2), '.', SUBSTRING(village.id, 7, 4)) as code,
                'DESA' as level,
                village.name as name,
                district.id as parent_id,
                district.name as parent_name,
                0 as child_count,
                0 as puskesmas_coverage,
                COALESCE(status.is_active, 1) as is_active
            ")
            ->unionAll($provinceQuery)
            ->unionAll($regencyQuery)
            ->unionAll($districtQuery);
    }

    private function regionStatusJoin(string $level, string $idExpression): \Closure
    {
        return function ($join) use ($level, $idExpression): void {
            $join->on('status.region_id', '=', DB::raw($idExpression))
                ->where('status.region_level', '=', $level);
        };
    }

    private function transformRecord(array $record): array
    {
        return [
            'id' => (string) $record['id'],
            'code' => (string) $record['code'],
            'level' => (string) $record['level'],
            'name' => (string) $record['name'],
            'parentId' => $record['parent_id'] ? (string) $record['parent_id'] : '',
            'parentName' => (string) ($record['parent_name'] ?? '-'),
            'childCount' => (int) ($record['child_count'] ?? 0),
            'puskesmasCoverage' => (int) ($record['puskesmas_coverage'] ?? 0),
            'isActive' => (bool) ($record['is_active'] ?? true),
        ];
    }

    private function parentOptionsForLevel(string $targetLevel): array
    {
        if ($targetLevel === '') {
            return DB::query()
                ->fromSub($this->buildUnionQuery(), 'regions')
                ->whereIn('level', ['PROVINSI', 'KABUPATEN', 'KECAMATAN'])
                ->orderBy('code')
                ->get(['id as value', 'code', 'name', 'level'])
                ->map(fn ($item) => [
                    'value' => (string) $item->value,
                    'label' => sprintf('%s - %s', $item->code, $item->name),
                    'level' => (string) $item->level,
                ])
                ->all();
        }

        $parentLevel = match ($targetLevel) {
            'KABUPATEN' => 'PROVINSI',
            'KECAMATAN' => 'KABUPATEN',
            'DESA' => 'KECAMATAN',
            default => '',
        };

        if ($parentLevel === '') {
            return [];
        }

        return DB::query()
            ->fromSub($this->buildUnionQuery(), 'regions')
            ->where('level', $parentLevel)
            ->orderBy('code')
            ->get(['id as value', 'code', 'name', 'level'])
            ->map(fn ($item) => [
                'value' => (string) $item->value,
                'label' => sprintf('%s - %s', $item->code, $item->name),
                'level' => (string) $item->level,
            ])
            ->all();
    }

    private function normalizeLevel(string $level): string
    {
        $normalized = strtoupper(trim($level));

        if (! in_array($normalized, self::LEVELS, true)) {
            throw ValidationException::withMessages([
                'level' => ['Level wilayah tidak valid.'],
            ]);
        }

        return $normalized;
    }

    private function normalizeCode(string $code, string $level): string
    {
        $normalized = preg_replace('/\D+/', '', trim($code)) ?? '';
        $expectedLength = match ($level) {
            'PROVINSI' => 2,
            'KABUPATEN' => 4,
            'KECAMATAN' => 6,
            'DESA' => 10,
        };

        if (strlen($normalized) !== $expectedLength) {
            throw ValidationException::withMessages([
                'code' => ["Kode wilayah untuk level {$level} harus memiliki {$expectedLength} digit."],
            ]);
        }

        return $normalized;
    }

    private function normalizeParentId(null|string $parentId): ?string
    {
        if ($parentId === null) {
            return null;
        }

        $normalized = preg_replace('/\D+/', '', trim($parentId)) ?? '';

        return $normalized !== '' ? $normalized : null;
    }

    private function validateHierarchy(string $level, string $id, ?string $parentId): void
    {
        if ($level === 'PROVINSI') {
            if ($parentId !== null) {
                throw ValidationException::withMessages([
                    'parent_id' => ['Provinsi tidak boleh memiliki induk wilayah.'],
                ]);
            }

            return;
        }

        if ($parentId === null) {
            throw ValidationException::withMessages([
                'parent_id' => ['Induk wilayah wajib diisi.'],
            ]);
        }

        $expectedParentLength = match ($level) {
            'KABUPATEN' => 2,
            'KECAMATAN' => 4,
            'DESA' => 6,
        };

        if (strlen($parentId) !== $expectedParentLength) {
            throw ValidationException::withMessages([
                'parent_id' => ['Format induk wilayah tidak sesuai dengan level yang dipilih.'],
            ]);
        }

        if (! str_starts_with($id, $parentId)) {
            throw ValidationException::withMessages([
                'code' => ['Kode wilayah harus mengikuti prefix induk wilayah.'],
            ]);
        }

        $parentExists = match ($level) {
            'KABUPATEN' => Province::query()->whereKey($parentId)->exists(),
            'KECAMATAN' => Regency::query()->whereKey($parentId)->exists(),
            'DESA' => District::query()->whereKey($parentId)->exists(),
            default => false,
        };

        if (! $parentExists) {
            throw ValidationException::withMessages([
                'parent_id' => ['Induk wilayah tidak ditemukan.'],
            ]);
        }
    }

    private function buildAttributes(string $level, string $id, string $name, ?string $parentId): array
    {
        return match ($level) {
            'PROVINSI' => ['id' => $id, 'name' => trim($name)],
            'KABUPATEN' => ['id' => $id, 'province_id' => $parentId, 'name' => trim($name)],
            'KECAMATAN' => ['id' => $id, 'regency_id' => $parentId, 'name' => trim($name)],
            'DESA' => ['id' => $id, 'district_id' => $parentId, 'name' => trim($name)],
        };
    }

    private function persistStatus(string $level, string $id, bool $isActive): void
    {
        RegionStatus::query()->updateOrCreate(
            ['region_level' => $level, 'region_id' => $id],
            ['is_active' => $isActive],
        );
    }

    private function modelClassForLevel(string $level): string
    {
        return match ($level) {
            'PROVINSI' => Province::class,
            'KABUPATEN' => Regency::class,
            'KECAMATAN' => District::class,
            'DESA' => Village::class,
        };
    }

    private function newModelForLevel(string $level): Province|Regency|District|Village
    {
        $class = $this->modelClassForLevel($level);

        return new $class();
    }

    private function parseCsv(UploadedFile $file): Collection
    {
        $lines = file($file->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        if (count($lines) < 2) {
            return collect();
        }

        $headers = array_map(
            fn ($header) => strtolower(trim((string) $header)),
            str_getcsv(array_shift($lines)),
        );

        return collect($lines)
            ->map(function (string $line) use ($headers): ?array {
                $values = str_getcsv($line);

                if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) {
                    return null;
                }

                return array_combine($headers, array_pad($values, count($headers), null)) ?: null;
            })
            ->filter()
            ->values();
    }

    private function parseBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        if ($normalized === '' || in_array($normalized, ['1', 'true', 'aktif', 'active', 'yes'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'false', 'inactive', 'nonaktif', 'no'], true)) {
            return false;
        }

        return true;
    }

    private function householdCoverage(string $level, string $id): int
    {
        return match ($level) {
            'PROVINSI' => DB::table('mstr_households as household')
                ->join('reg_villages as village', 'village.id', '=', 'household.village_id')
                ->join('reg_districts as district', 'district.id', '=', 'village.district_id')
                ->join('reg_regencies as regency', 'regency.id', '=', 'district.regency_id')
                ->where('regency.province_id', $id)
                ->count(),
            'KABUPATEN' => DB::table('mstr_households as household')
                ->join('reg_villages as village', 'village.id', '=', 'household.village_id')
                ->join('reg_districts as district', 'district.id', '=', 'village.district_id')
                ->where('district.regency_id', $id)
                ->count(),
            'KECAMATAN' => DB::table('mstr_households')
                ->whereIn('village_id', DB::table('reg_villages')->where('district_id', $id)->select('id'))
                ->count(),
            'DESA' => DB::table('mstr_households')->where('village_id', $id)->count(),
        };
    }

    private function userCoverage(string $level, string $id): int
    {
        return match ($level) {
            'PROVINSI' => DB::table('users as user')
                ->leftJoin('reg_districts as district', 'district.id', '=', 'user.district_id')
                ->leftJoin('reg_regencies as regency', 'regency.id', '=', 'district.regency_id')
                ->where('regency.province_id', $id)
                ->count(),
            'KABUPATEN' => DB::table('users as user')
                ->leftJoin('reg_districts as district', 'district.id', '=', 'user.district_id')
                ->where('district.regency_id', $id)
                ->count(),
            'KECAMATAN' => DB::table('users')->where('district_id', $id)->count(),
            'DESA' => DB::table('users')->where('village_id', $id)->count(),
        };
    }
}
