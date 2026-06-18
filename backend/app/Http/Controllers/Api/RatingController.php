<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\Ticket;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            "score" => "required|integer|min:1|max:5",
            "comment" => "nullable|string|max:500",
        ]);

        if ($ticket->status !== "closed") {
            return response()->json(["message" => "Only closed tickets can be rated."], 422);
        }

        $rating = Rating::updateOrCreate(
            ["ticket_id" => $ticket->id],
            [
                "user_id" => $request->user()->id,
                "score" => $data["score"],
                "comment" => $data["comment"] ?? null,
            ]
        );

        return response()->json($rating, 201);
    }

    public function show(Ticket $ticket)
    {
        $rating = Rating::where("ticket_id", $ticket->id)->first();
        return response()->json($rating);
    }
}
