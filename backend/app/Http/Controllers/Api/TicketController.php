<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Category;
use App\Models\CategoryGroup;
use App\Models\KeywordRule;
use App\Notifications\TicketCreated;
use App\Notifications\TicketAssigned;
use App\Notifications\TicketStatusChanged;
use App\Services\TeamsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(['category.group', 'user', 'executor']);
        if ($user->role === 'user') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'executor') {
            $query->where(function($q) use ($user) {
                $q->where('executor_id', $user->id)
                  ->orWhere('status', 'new');
            });
        }
        if ($request->status) $query->where('status', $request->status);
        if ($request->group_id) $query->whereHas('category', fn($q) => $q->where('group_id', $request->group_id));
        if ($request->priority) $query->where('priority', $request->priority);
        if ($request->executor_id) $query->where('executor_id', $request->executor_id);
        if ($request->search) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('title', 'ilike', "%{$s}%")
                  ->orWhere('description', 'ilike', "%{$s}%");
            });
        }
        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to) $query->whereDate('created_at', '<=', $request->date_to);
        if ($request->due_date_from) $query->whereDate('due_date', '>=', $request->due_date_from);
        if ($request->due_date_to) $query->whereDate('due_date', '<=', $request->due_date_to);
        if ($request->overdue === 'true') $query->whereNotNull('due_date')->where('due_date', '<', now())->whereNotIn('status', ['closed', 'cancelled']);
        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'executor_id' => 'sometimes|exists:users,id',
            'due_date' => 'nullable|date',
            'co_executor_id' => 'nullable|exists:users,id',
            'observer_id' => 'nullable|exists:users,id',
            'reviewer_id' => 'nullable|exists:users,id',
        ]);
        $validated['user_id'] = $request->user()->id;
        $validated['status'] = 'new';
        if (!isset($validated['priority'])) $validated['priority'] = 'medium';

        // SLA: auto-calculate due_date based on priority
        if (!isset($validated['due_date'])) {
            $slaHours = ['low' => 72, 'medium' => 24, 'high' => 8, 'urgent' => 4];
            $validated['due_date'] = now()->addHours($slaHours[$validated['priority']] ?? 24);
        }

        if (!isset($validated['executor_id'])) {
            $match = $this->matchKeywordsLogic($validated['title']);
            if ($match && isset($match['executor_id'])) {
                $validated['executor_id'] = $match['executor_id'];
            }
        }

        if (!isset($validated['executor_id'])) {
            $category = Category::with('defaultExecutor')->find($validated['category_id']);
            if ($category && $category->default_executor) {
                $validated['executor_id'] = $category->default_executor->id;
            }
        }

        if (isset($validated['executor_id'])) {
            $validated['assigned_by'] = $request->user()->id;
            $validated['assigned_at'] = now();
        }

        $ticket = Ticket::create($validated);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('uploads/' . $ticket->id, 'public');
                $ticket->files()->create([
                    'original_name' => $file->getClientOriginalName(),
                    'stored_path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        $ticket->load(['category.group', 'user', 'executor', 'coExecutor', 'observer', 'reviewer', 'files']);
        try { $ticket->user->notify(new TicketCreated($ticket)); } catch (\Exception $e) {}
            try { TeamsService::send("Нова заявка #{$ticket->id}", "{$ticket->title}\n{$ticket->description}", "1F6EB0", env("APP_FRONTEND_URL", config("app.url")) . "/tickets/" . $ticket->id); } catch (\Exception $e) {}
        if ($ticket->executor) {
            try { $ticket->executor->notify(new TicketAssigned($ticket)); } catch (\Exception $e) {}
            try { TeamsService::send("Заявка #{$ticket->id} призначена", "Виконавець: {$ticket->executor->name}\n{$ticket->title}", "D4A017", env("APP_FRONTEND_URL", config("app.url")) . "/tickets/" . $ticket->id); } catch (\Exception $e) {}
        }
        return response()->json($ticket, 201);
    }

    public function show(Ticket $ticket)
    {
        $ticket->load(['category.group', 'user', 'executor', 'coExecutor', 'observer', 'reviewer', 'comments.user', 'files', 'logs.user', 'rating']);
        return response()->json($ticket);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        $allowed = ['status', 'executor_id', 'priority', 'due_date', 'co_executor_id', 'observer_id', 'reviewer_id'];
        $data = $request->only($allowed);
        $changes = [];
        if (isset($data['status']) && $data['status'] !== $ticket->status) {
            $ticket->status = $data['status'];
            $changes[] = 'status';
            if ($data['status'] === 'resolved' || $data['status'] === 'closed') {
                $ticket->resolved_at = now();
            }
        }
        if (isset($data['executor_id']) && $data['executor_id'] !== $ticket->executor_id) {
            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Only admin can assign executor.'], 403);
            }
            $ticket->executor_id = $data['executor_id'];
            $ticket->assigned_by = $user->id;
            $ticket->assigned_at = now();
            $changes[] = 'executor';
        }
        foreach (['co_executor_id', 'observer_id', 'reviewer_id'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== $ticket->$field) {
                $ticket->$field = $data[$field] ?: null;
                $changes[] = $field;
            }
        }
        if (array_key_exists('due_date', $data) && $data['due_date'] !== optional($ticket->due_date)->format('Y-m-d\\TH:i:sP')) {
            $ticket->due_date = $data['due_date'] ?: null;
            $changes[] = 'due_date';
        }
        if (isset($data['priority'])) {
            $ticket->priority = $data['priority'];
            $changes[] = 'priority';
        }
        $ticket->save();
        $ticket->load(['category.group', 'user', 'executor', 'coExecutor', 'observer', 'reviewer']);
        foreach ($changes as $field) {
            $oldVal = $ticket->getOriginal($field === 'executor' ? 'executor_id' : $field);
            $newVal = $ticket->$field;
            if ($field === 'executor') {
                $oldVal = $ticket->getOriginal('executor_id');
                $newVal = $ticket->executor_id;
            }
            try {
                \App\Models\TicketLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'field' => $field,
                    'old_value' => (string)$oldVal,
                    'new_value' => (string)$newVal,
                ]);
            } catch (\Exception $e) {}
        }
        if (in_array('status', $changes) && $ticket->user_id !== $user->id) {
            try { $ticket->user->notify(new TicketStatusChanged($ticket)); } catch (\Exception $e) {}
            try { TeamsService::send("Статус заявки #{$ticket->id} змінено", "Статус: {$ticket->status}\n{$ticket->title}", "3A8C2C", env("APP_FRONTEND_URL", config("app.url")) . "/tickets/" . $ticket->id); } catch (\Exception $e) {}
        }
        if (in_array('executor', $changes) && $ticket->executor) {
            try { $ticket->executor->notify(new TicketAssigned($ticket)); } catch (\Exception $e) {}
            try { TeamsService::send("Заявка #{$ticket->id} призначена", "Виконавець: {$ticket->executor->name}\n{$ticket->title}", "D4A017", env("APP_FRONTEND_URL", config("app.url")) . "/tickets/" . $ticket->id); } catch (\Exception $e) {}
        }
        return response()->json($ticket);
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return response()->json(null, 204);
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $validated = $request->validate(["executor_id" => "required|exists:users,id"]);
        $ticket->executor_id = $validated["executor_id"];
        $ticket->assigned_by = $request->user()->id;
        $ticket->assigned_at = now();
        $ticket->save();
        $ticket->load(["category.group", "user", "executor"]);
        try { $ticket->executor->notify(new \App\Notifications\TicketAssigned($ticket)); } catch (\Exception $e) {}
        return response()->json($ticket);
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(['category.group', 'user', 'executor']);
        if ($user->role === 'user') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'executor') {
            $query->where('executor_id', $user->id);
        }
        if ($request->status) $query->where('status', $request->status);
        if ($request->executor_id) $query->where('executor_id', $request->executor_id);
        if ($request->search) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('title', 'ilike', "%{$s}%")
                  ->orWhere('description', 'ilike', "%{$s}%");
            });
        }

        $tickets = $query->latest()->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="tickets.csv"',
        ];

        $callback = function() use ($tickets) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM
            fputcsv($handle, ['ID', 'Тема', 'Статус', 'Пріоритет', 'Категорія', 'Автор', 'Виконавець', 'Створено', 'Термін', 'Вирішено']);

            $statusLabels = ['new' => 'Нова', 'in_progress' => 'В роботі', 'resolved' => 'Вирішена', 'closed' => 'Закрита', 'cancelled' => 'Скасована'];
            $priorityLabels = ['low' => 'Низький', 'medium' => 'Середній', 'high' => 'Високий', 'urgent' => 'Терміновий'];

            foreach ($tickets as $t) {
                fputcsv($handle, [
                    $t->id,
                    $t->title,
                    $statusLabels[$t->status] ?? $t->status,
                    $priorityLabels[$t->priority] ?? $t->priority,
                    $t->category?->name ?? '',
                    $t->user?->name ?? '',
                    $t->executor?->name ?? '',
                    $t->created_at?->format('d.m.Y H:i') ?? '',
                    $t->due_date?->format('d.m.Y H:i') ?? '',
                    $t->resolved_at?->format('d.m.Y H:i') ?? '',
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function executors()
    {
        return response()->json(
            \App\Models\User::whereIn('role', ['executor', 'admin'])->where('is_active', true)->get(['id', 'name', 'email'])
        );
    }

    public function categories()
    {
        return response()->json(
            \App\Models\Category::with('group')->get()
        );
    }

    public function matchKeywords(Request $request)
    {
        $title = $request->input('title', '');
        if (empty($title)) {
            return response()->json(null);
        }
        $match = $this->matchKeywordsLogic($title);
        return response()->json($match);
    }

    private function matchKeywordsLogic(string $title): ?array
    {
        $rules = KeywordRule::where('is_active', true)
            ->with(['categoryGroup', 'category', 'executor'])
            ->orderBy('sort')
            ->get();

        $lower = mb_strtolower($title);
        foreach ($rules as $rule) {
            if (mb_strpos($lower, mb_strtolower($rule->keyword)) !== false) {
                $result = ['keyword_rule_id' => $rule->id];

                if ($rule->category_group_id) {
                    $result['category_group_id'] = $rule->category_group_id;
                    $result['category_group_name'] = $rule->categoryGroup?->name;
                }
                if ($rule->category_id) {
                    $result['category_id'] = $rule->category_id;
                    $result['category_name'] = $rule->category?->name;
                }
                if ($rule->executor_id) {
                    $result['executor_id'] = $rule->executor_id;
                    $result['executor_name'] = $rule->executor?->name;
                }

                return $result;
            }
        }

        return null;
    }
}
