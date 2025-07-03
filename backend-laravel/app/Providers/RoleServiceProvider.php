<?php

namespace App\Providers;

use App\Services\Implementations\RoleServiceImpl;
use App\Services\Interfaces\RoleService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class RoleServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public array $singletons = [
        RoleService::class => RoleServiceImpl::class
    ];

    public function provides()
    {
        return [RoleService::class];
    }
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
