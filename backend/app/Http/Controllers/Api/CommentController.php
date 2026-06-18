<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Comment;
use App\Notifications\NewComment;
use Illuminate\Http\Request;
class CommentController extends Controller
{
    public function index(Ticket $ticket)
    {
        return response()->json($ticket->comments()->with('user')->latest()->get());
    }
    public function store(Request $request, Ticket $ticket)
    {
        $validated = $request->validate(['content' => 'required|string']);
        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);
        $comment->load('user');
        $recipients = collect();
        if ($ticket->user_id !== $request->user()->id) $recipients->push($ticket->user);
        if ($ticket->executor_id && $ticket->executor_id !== $request->user()->id) $recipients->push($ticket->executor);
        foreach ($recipients->unique('id') as $recipient) {
            try { $recipient->notify(new NewComment($ticket, $comment)); } catch (\Exception $e) {}
        }
        return response()->json($comment, 201);
    }
    public function destroy(Request $request, Ticket $ticket, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $comment->delete();
        return response()->json(null, 204);
    }
}
