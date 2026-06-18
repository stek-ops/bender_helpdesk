<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Models\CategoryGroup;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            "total_tickets" => Ticket::count(),
            "new_tickets" => Ticket::where("status", "new")->count(),
            "in_progress" => Ticket::where("status", "in_progress")->count(),
            "resolved" => Ticket::where("status", "resolved")->count(),
            "closed" => Ticket::where("status", "closed")->count(),
            "by_group" => CategoryGroup::withCount("categories")
                ->with(["categories" => function($q) {
                    $q->withCount("tickets");
                }])->get(),
            "by_executor" => User::where("role", "executor")
                ->withCount(["assignedTickets" => fn($q) => $q->where("status", "!=", "closed")])
                ->get(),
        ]);
    }

    public function charts()
    {
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format("Y-m-d");
            $days[] = [
                "date" => $date,
                "label" => now()->subDays($i)->format("d.m"),
                "count" => Ticket::whereDate("created_at", $date)->count(),
                "resolved" => Ticket::whereDate("resolved_at", $date)->count(),
            ];
        }

        $executors = User::where("role", "executor")
            ->where("is_active", true)
            ->withCount(["assignedTickets as open_count" => function($q) {
                $q->whereNotIn("status", ["closed", "cancelled"]);
            }])
            ->withCount(["assignedTickets as total_count"])
            ->get()
            ->map(fn($u) => ["name" => $u->name, "open" => $u->open_count, "total" => $u->total_count]);

        $byStatus = Ticket::selectRaw("status, count(*) as count")
            ->groupBy("status")->pluck("count", "status");

        return response()->json(["daily" => $days, "executors" => $executors, "by_status" => $byStatus]);
    }
}
