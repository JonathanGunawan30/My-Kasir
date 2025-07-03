<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class SyncPermissions extends Command
{
    protected $signature = 'sync:permissions';

    protected $description = 'Duplicate all web permissions to api guard if not exists';

    public function handle()
    {
        $webPermissions = Permission::where('guard_name', 'web')->get();
        $created = 0;

        foreach ($webPermissions as $perm) {
            $exists = Permission::where('name', $perm->name)
                ->where('guard_name', 'api')
                ->exists();

            if (! $exists) {
                Permission::create([
                    'name' => $perm->name,
                    'guard_name' => 'api',
                ]);
                $this->info("Created API permission: {$perm->name}");
                $created++;
            }
        }

        $this->info("✅ Done! Total created: $created permission(s).");
        return 0;
    }
}
