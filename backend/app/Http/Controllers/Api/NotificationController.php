<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function unread(Request $request)
    {
        $notifications = $request->user()->notifications()
            ->whereNull("read_at")
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($n) {
                return [
                    "id" => $n->id,
                    "type" => class_basename($n->type),
                    "data" => $n->data,
                    "created_at" => $n->created_at->diffForHumans(),
                ];
            });

        return response()->json($notifications);
    }

    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()
            ->where("id", $id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(["ok" => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(["ok" => true]);
    }
}
