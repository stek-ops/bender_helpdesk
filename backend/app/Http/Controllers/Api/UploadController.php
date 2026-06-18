<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:10240',
        ]);

        $path = $request->file('file')->store('uploads/inline', 'public');

        return response()->json([
            'url' => '/storage/' . $path,
            'path' => $path,
        ]);
    }
}
