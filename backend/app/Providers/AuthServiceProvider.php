<?php
namespace App\Providers;
use App\Models\Ticket;
use App\Policies\TicketPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Ticket::class => TicketPolicy::class,
    ];
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define("admin", function (\App\Models\User $user) {
            return $user->isAdmin();
        });
    }
}
