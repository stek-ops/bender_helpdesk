<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\Admin\CategoryGroupController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\SettingsController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload', [App\Http\Controllers\Api\UploadController::class, 'store']);
    Route::post('/ai/ask', [App\Http\Controllers\Api\AiController::class, 'ask']);
    Route::get('/notifications/unread', [App\Http\Controllers\Api\NotificationController::class, 'unread']);
    Route::post('/notifications/{id}/read', [App\Http\Controllers\Api\NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/tickets/match-keywords', [TicketController::class, 'matchKeywords']);
    Route::get('/tickets/executors', [TicketController::class, 'executors']);
    Route::get('/tickets/categories', [TicketController::class, 'categories']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/export', [TicketController::class, 'export']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::put('/tickets/{ticket}', [TicketController::class, 'update']);
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy'])->middleware('can:delete,ticket');

    Route::get('/tickets/{ticket}/comments', [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);
    Route::delete('/tickets/{ticket}/comments/{comment}', [CommentController::class, 'destroy']);

    
    // Knowledge Base
    Route::get('/kb', [\App\Http\Controllers\Api\KbArticleController::class, 'index']);
    Route::get('/kb/{kbArticle}', [\App\Http\Controllers\Api\KbArticleController::class, 'show']);

    // Ratings
    Route::post('/tickets/{ticket}/rate', [\App\Http\Controllers\Api\RatingController::class, 'store']);
    Route::get('/tickets/{ticket}/rating', [\App\Http\Controllers\Api\RatingController::class, 'show']);

    // Profile
    Route::get('/profile', [\App\Http\Controllers\Api\AuthController::class, 'profile']);
    Route::put('/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);

    Route::middleware('can:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'stats']);
        Route::get('/dashboard/charts', [DashboardController::class, 'charts']);
        Route::apiResource('/category-groups', CategoryGroupController::class);
        Route::apiResource('/categories', CategoryController::class);
        Route::apiResource('/users', UserController::class);
        Route::apiResource('/keyword-rules', \App\Http\Controllers\Api\Admin\KeywordRuleController::class);
        Route::get('/settings/teams', [SettingsController::class, 'getTeams']);
        Route::put('/settings/teams', [SettingsController::class, 'updateTeams']);
        Route::post('/settings/teams/test', [SettingsController::class, 'testTeams']);
        Route::get('/settings/ldap', [SettingsController::class, 'getLdap']);
        Route::put('/settings/ldap', [SettingsController::class, 'updateLdap']);
        Route::post('/settings/ldap/test', [SettingsController::class, 'testLdap']);
        Route::apiResource('/kb', \App\Http\Controllers\Api\KbArticleController::class)->except(['index', 'show']);
        Route::get('/settings/email', [\App\Http\Controllers\Api\Admin\SettingsController::class, 'getEmail']);
        Route::put('/settings/email', [\App\Http\Controllers\Api\Admin\SettingsController::class, 'updateEmail']);
        Route::post('/settings/email/test', [\App\Http\Controllers\Api\Admin\SettingsController::class, 'testEmail']);
    });
});

// Microsoft 365 OAuth
Route::get('/auth/microsoft', [\App\Http\Controllers\Api\MicrosoftOauthController::class, 'redirect']);
Route::get('/auth/microsoft/callback', [\App\Http\Controllers\Api\MicrosoftOauthController::class, 'callback'])->withoutMiddleware([\App\Http\Middleware\Authenticate::class]);

// Admin Microsoft settings
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/settings/microsoft', [\App\Http\Controllers\Api\Admin\SettingsController::class, 'getMicrosoft']);
    Route::put('/admin/settings/microsoft', [\App\Http\Controllers\Api\Admin\SettingsController::class, 'updateMicrosoft']);
});
