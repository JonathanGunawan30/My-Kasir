<?php

namespace App\Providers;

use App\Services\Implementations\ProfileServiceImpl;
use App\Services\Interfaces\ProfileService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class ProfileServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public array $singletons = [
        ProfileService::class => ProfileServiceImpl::class,
    ];

    public function provides(): array
    {
        return [ProfileService::class];
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
